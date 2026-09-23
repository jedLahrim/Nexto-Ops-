import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskSubscriber } from './subscribers/task.subscriber';
import { PermissionModule } from '../permission/permission.module';
import { UseCase } from '../ai/categories/use-cases/entities/use-case.entity';
import { BullModule } from '@nestjs/bull';
import { Constant } from '../commons/constant';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, UseCase]),
    PermissionModule,
    BullModule.registerQueue({ name: Constant.MEMBER_QUEUE }),
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskSubscriber],
  exports: [TasksService],
})
export class TasksModule {}
