import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dir = join(__dirname, 'templates/');
        // const port = configService.get('MAIL_PORT');
        const streamType = configService.get('MAIL_STREAM_TYPE');
        return {
          transport: {
            host: configService.get('MAIL_HOST'),
            // port: port,
            auth: {
              user: configService.get('MAIL_USER'),
              pass: configService.get('MAIL_PASS'),
            },
            headers: {
              'X-PM-Message-Stream': streamType,
            },
          },
          defaults: {
            from: `"${configService.get('MAIL_FROM_NAME')}" <${configService.get('MAIL_FROM_EMAIL')}>`,
          },
          template: {
            dir: dir,
            adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
