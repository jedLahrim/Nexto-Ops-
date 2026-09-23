import { Module } from '@nestjs/common';
import { TaskSchedulingService } from './task-scheduling.service';
import { TaskSchedulingController } from './task-scheduling.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Notification]), NotificationsModule],
  controllers: [TaskSchedulingController],
  providers: [TaskSchedulingService],
  exports: [TaskSchedulingService],
})
export class TaskSchedulingModule {}
