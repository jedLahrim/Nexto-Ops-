import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TransformInterceptor } from './transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { EntityNotFoundExceptionFilter } from './commons/filters/entity-not-found-exception.filter';
import * as bodyParser from 'body-parser';
import { seedAdmins } from '../seed-admin';

async function bootstrap() {
  const logger = new Logger();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logger,
  });
  _initConfig(app);
  _initFirebaseApp();
  seedAdmins();
  // _initSwagger(app);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application listening on port: ${port}`);
}

function _initFirebaseApp() {
  // Initialize the Firebase app
  const cert = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
  return admin.initializeApp({
    credential: admin.credential.cert(cert as ServiceAccount),
  });
}

function _initConfig(app: NestExpressApplication) {
  app.setGlobalPrefix('api');
  // app.enableVersioning({
  //   type: VersioningType.HEADER,
  //   header: 'api-version',
  //   defaultVersion: ['1', '2'],
  // });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new EntityNotFoundExceptionFilter());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.enableCors();
}

function _initSwagger(app: NestExpressApplication) {
  const config = new DocumentBuilder()
    .setTitle('Yozen')
    .setDescription('The Yozen API description')
    .setVersion('1.0')
    .addTag('Yozen')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}

bootstrap();
