import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import * as path from 'path';
import { join } from 'path';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { AttachmentsModule } from './attachments/attachments.module';
import { UserModule } from './user/user.module';
import { TokensModule } from './tokens/tokens.module';
import { PostsModule } from './posts/posts.module';
import { TagsModule } from './posts/tags/tags.module';
import { ShareModule } from './share/share.module';
import { FaqsModule } from './faqs/faqs.module';
import { TutorialsModule } from './tutorials/tutorials.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';
import { PermissionModule } from './permission/permission.module';
import { S3Module, S3ModuleOptions } from 'nestjs-s3';
import { AudioTranscriptionModule } from './audio-transcription/audio-transcription.module';
import { AiModule } from './ai/ai.module';
import { BullModule } from '@nestjs/bull';
import { ExportDataModule } from './exports/export-data/export-data.module';
import { StatusModule } from './status/status.module';
import { UseCasesModule } from './ai/categories/use-cases/use-cases.module';
import { AiInsightsModule } from './ai/categories/ai-insights/ai-insights.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TaskSchedulingModule } from './task-scheduling/task-scheduling.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventListenersModule } from './event-listeners/event-listeners.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { UseCaseCategoriesModule } from './ai/categories/use-case-categories.module';
import { CategoriesModule } from './posts/categories/categories.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { MauticModule } from './mail/mautic/mautic.module';
import { EntriesModule } from './entries/entries.module';
import { EntryCategoriesModule } from './entries/entries-categotries/entry-categories.module';
import { ChallengesModule } from './challenges/challenges.module';
import { StreaksModule } from './streaks/streaks.module';
import { TasksModule } from './task/tasks.module';
import { MoodsModule } from './moods/moods.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ErpUsersModule } from './erp-users/erp-users.module';
import { PermissionSetsModule } from './permission-sets/permission-sets.module';
import { ItsmModule } from './itsm/itsm.module';
import { AssetsModule } from './assets/assets.module';
import { VendorsModule } from './vendors/vendors.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ProcurementModule } from './procurement/procurement.module';
import { ContractsModule } from './contracts/contracts.module';
import { LicensesModule } from './licenses/licenses.module';
import { RisksModule as RiskRegisterModule } from './risks/risks.module';
import { BudgetModule } from './budget/budget.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: false,
      envFilePath: '.env',
      isGlobal: true,
    }),
    S3Module.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<S3ModuleOptions> => {
        const endpoint = configService.get('AWS_ENDPOINT');
        const region = configService.get('AWS_REGION');
        const accessKeyId = configService.get('AWS_ACCESS_KEY');
        const secretAccessKey = configService.get('AWS_SECRET_KEY');

        return {
          config: {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
            region,
            endpoint,
            forcePathStyle: true,
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        console.log(`dirname=${__dirname}`);
        const host = configService.get('DB_HOST');
        const port = configService.get('DB_PORT');
        const username = configService.get('DB_USERNAME');
        const password = configService.get('DB_PASSWORD');
        const database = configService.get('DB_NAME');
        const timezone = configService.get('DB_TIMEZONE');
        const env = process.env.ENV;
        const production = process.env.ENV == 'prod';
        const synchronize = !production;
        // also true for first launch of app in production
        if (env !== 'prod') {
          console.log(`DB_HOST=${host}\nDB_PORT=${port}\nDB_USERNAME=${username}\nDB=${database}\nENV=${env}`);
        }

        return {
          type: 'mysql',
          host,
          port,
          username,
          password,
          database,
          acquireTimeout: 30000,
          retryAttempts: 6,
          retryDelay: 5000,
          autoLoadEntities: true,
          synchronize: synchronize,
          logging: false,
          // what timezone of your database NOT what timezone you want to make your database
          timezone: timezone,
          migrations: [join(__dirname, './migrations/*{.ts,.js}')],
          migrationsRun: production,
        };
      },
    }),
    DevtoolsModule.register({
      http: process.env.ENV !== 'prod',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const username = configService.get('REDIS_USERNAME');
        const password = configService.get('REDIS_PASSWORD');
        const tls = configService.get('REDIS_TLS') == 'true' ? {} : null;
        return {
          redis: {
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
            username: username || null,
            password: password || null,
            tls: tls,
          },
        };
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      fallbacks: {
        'en-*': 'en',
        'es-*': 'es',
        'fr-*': 'fr',
        'pt-*': 'pt',
        'de-*': 'de',
        'id-*': 'id',
        'ja-*': 'ja',
        'da-*': 'da',
        'ar-*': 'ar',
      },
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [{ use: QueryResolver, options: ['lang'] }, AcceptLanguageResolver],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const tls = configService.get('REDIS_TLS') == 'true';
        const username = configService.get('REDIS_USERNAME');
        const password = configService.get('REDIS_PASSWORD');
        const store = await redisStore({
          username: username || null,
          password: password || null,
          socket: {
            reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
            tls: tls,
          },
        });
        // Attach event listeners for Redis client
        const redisClient = store.client;
        redisClient.on('error', (err: Error) => {});

        return { store };
      },
    }),
    UserModule,
    AttachmentsModule,
    TokensModule,
    PostsModule,
    TagsModule,
    ShareModule,
    FaqsModule,
    TutorialsModule,
    NotificationsModule,
    MailModule,
    PermissionModule,
    AudioTranscriptionModule,
    AiModule,
    ExportDataModule,
    StatusModule,
    UseCasesModule,
    UseCaseCategoriesModule,
    AiInsightsModule,
    SubscriptionsModule,
    EventEmitterModule.forRoot({}),
    ScheduleModule.forRoot(),
    TaskSchedulingModule,
    EventListenersModule,
    SuggestionsModule,
    CategoriesModule,
    MauticModule,
    EntriesModule,
    EntryCategoriesModule,
    ChallengesModule,
    StreaksModule,
    MoodsModule,
    TasksModule,
    DashboardModule,
    ErpUsersModule,
    PermissionSetsModule,
    ItsmModule,
    AssetsModule,
    VendorsModule,
    MaintenanceModule,
    ProcurementModule,
    ContractsModule,
    LicensesModule,
    RiskRegisterModule,
    BudgetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
