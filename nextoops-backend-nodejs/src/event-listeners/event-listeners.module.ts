import { forwardRef, Module } from '@nestjs/common';
import { EventListenersService } from './event-listeners.service';
import { EventListenersController } from './event-listeners.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { PermissionModule } from '../permission/permission.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ExportDataModule } from '../exports/export-data/export-data.module';
import { BullModule } from '@nestjs/bull';
import { Constant } from '../commons/constant';
import { AttachmentsService } from '../attachments/attachments.service';
import { MauticModule } from '../mail/mautic/mautic.module';
import { AiInsight } from '../ai/categories/ai-insights/entities/ai-insight.entity';
import { AiInsightsModule } from '../ai/categories/ai-insights/ai-insights.module';
import { MailModule } from '../mail/mail.module';
import { UseCasesModule } from '../ai/categories/use-cases/use-cases.module';
import { Attachment } from '../attachments/entities/attachment.entity';
import { ChallengesModule } from '../challenges/challenges.module';
import { StreaksModule } from '../streaks/streaks.module';
import { Entry } from '../entries/entities/entry.entity';
import { Streak } from '../streaks/entities/streak.entity';
import { Mood } from '../moods/entities/mood.entity';
import { MoodsService } from '../moods/moods.service';
import { TasksModule } from '../task/tasks.module';
import { UseCase } from '../ai/categories/use-cases/entities/use-case.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AiInsight, Attachment,Entry, Streak, Mood,UseCase]),
    forwardRef(() => StreaksModule),
    PermissionModule,
    NotificationsModule,
    ExportDataModule,
    BullModule.registerQueue({ name: Constant.MEMBER_QUEUE }),
    MauticModule,
    UseCasesModule,
    MailModule,
    AiInsightsModule,
    ChallengesModule,
    TasksModule,
  ],
  controllers: [EventListenersController],
  providers: [EventListenersService, AttachmentsService, MoodsService],
})
export class EventListenersModule {}
