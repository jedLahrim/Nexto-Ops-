import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { FcmDevice } from './entities/fcm-device.entity';
import { FcmSubscribedTopic } from './entities/fcm-subscribed-topic.entity';
import { Notification } from './entities/notification.entity';
import { Post } from '../posts/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      FcmDevice,
      FcmSubscribedTopic,
      Notification,
      Post,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
