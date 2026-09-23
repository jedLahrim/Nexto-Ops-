import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { jwtStrategy } from './strategy/jwt.strategy';
import { VerificationCode } from './entities/verification-code.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { TokensModule } from '../tokens/tokens.module';
import { FcmDevice } from '../notifications/entities/fcm-device.entity';
import { FcmSubscribedTopic } from '../notifications/entities/fcm-subscribed-topic.entity';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ShareModule } from '../share/share.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { PermissionModule } from '../permission/permission.module';
import { BullModule } from '@nestjs/bull';
import { Post } from '../posts/entities/post.entity';
import { MemberQueueProcessor } from './queue/member-queue.processor';
import { Constant } from '../commons/constant';
import { UserSubscriber } from './subscribers/user.subscriber';
import { AppService } from '../app.service';
import { MauticModule } from '../mail/mautic/mautic.module';
import { Entry } from '../entries/entities/entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, VerificationCode, Attachment, FcmDevice, FcmSubscribedTopic, Post,Entry]),
    HttpModule,
    ShareModule,
    AttachmentsModule,
    ConfigModule,
    PassportModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          defaultStrategy: configService.get('JWT_STRATEGY_NAME'),
        };
      },
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET_KEY'),
        };
      },
    }),
    BullModule.registerQueue({ name: Constant.MEMBER_QUEUE }),
    TokensModule,
    MailModule,
    NotificationsModule,
    PermissionModule,
    AttachmentsModule,
    MauticModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    jwtStrategy,
    MemberQueueProcessor,
    UserSubscriber,
    AppService,
    UserSubscriber,
  ],
  exports: [UserService],
})
export class UserModule {}
