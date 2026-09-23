import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectQueue } from '@nestjs/bull';
import { Constant } from '../commons/constant';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatistics } from '../user/entities/user.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { AttachmentsService } from '../attachments/attachments.service';
import { MauticService } from '../mail/mautic/mautic.service';
import { AiInsight, TimeFrame } from '../ai/categories/ai-insights/entities/ai-insight.entity';
import { UseCasesController } from '../ai/categories/use-cases/use-cases.controller';
import { MailService } from '../mail/mail.service';
import { AiInsightsService } from '../ai/categories/ai-insights/ai-insights.service';
import { OnEvent } from '@nestjs/event-emitter';
import { EntryCreatedEvent } from './events/entry-created.event';
import { EntryRemovedEvent } from './events/entry-removed.event';
import { ChallengesService } from '../challenges/challenges.service';
import { Entry } from '../entries/entities/entry.entity';
import { StreaksService } from '../streaks/streaks.service';
import { Streak } from '../streaks/entities/streak.entity';
import { MoodsService } from '../moods/moods.service';
import { toDayString } from '../commons/utils';
import { TasksService } from '../task/tasks.service';
import { ExecuteUseCaseEvent } from './events/execute-use-case.event';
import { LastTimeLine, TimelineType } from '../ai/categories/use-cases/dto/use-case-meta-data.dto';
import { UseCase } from '../ai/categories/use-cases/entities/use-case.entity';
import { SubscriptionChangedEvent } from './events/subscription-changed.event';
import { EntryExecutedEvent } from './events/entry-executed.event';
import { ChallengeCompletedEvent } from './events/challenge-completed.event';
import { ExecuteUseCaseDto } from '../ai/categories/use-cases/dto/execute-use-case.dto';
import { FilterEntryDto } from '../entries/dto/filter-entry.dto';
import * as moment from 'moment/moment';

@Injectable()
export class EventListenersService {
  constructor(
    private readonly i18n: I18nService,
    @InjectQueue(Constant.MEMBER_QUEUE)
    private memberQueue: Queue,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    private attachmentsService: AttachmentsService,
    private taskService: TasksService,
    private mauticService: MauticService,
    private challengesService: ChallengesService,
    // @InjectRepository(Task)
    // private taskRepo: Repository<Task>,
    @InjectRepository(AiInsight)
    private aiInsightRepo: Repository<AiInsight>,
    private useCasesController: UseCasesController,
    private mailService: MailService,
    private aiInsightsService: AiInsightsService,
    private readonly i18nService: I18nService,
    private readonly streaksService: StreaksService,
    private readonly moodsService: MoodsService,
    @InjectRepository(Entry)
    private readonly entryRepo: Repository<Entry>,
    @InjectRepository(Streak)
    private readonly streakRepo: Repository<Streak>,
    @InjectRepository(UseCase)
    private readonly useCaseRepo: Repository<UseCase>,
  ) {}

  @OnEvent('entry.executed', { async: true })
  async handleEntryExecutedEvent(event: EntryExecutedEvent) {
    const { createdBy, entry } = event;
    const isPremium = createdBy.isPremium();

    // if (isPremium) await this.taskService.handleObjectiveEntryCreated(event);
    await this.taskService.handleObjectiveEntryCreated(event);
    await this._recomputeDailyMood(createdBy.id, entry.createdAt);
  }

  @OnEvent('entry.created', { async: true })
  async handleEntryCreatedEvent(event: EntryCreatedEvent) {
    console.log('handleEntryCreatedEvent');
    const { createdBy, entry } = event;

    await Promise.all([this._handleChallengeEntryCreatedEvent(event), this._handleStreak(event)]);

    await this._handleUpdateUserStatistics(entry, createdBy);

    await this.handleUserUpdateEvent(createdBy.id);

    //await this.moodsService.recomputeDailyMood(createdBy.id, entry.createdAt);
  }

  private async _recomputeDailyMood(userId: string, createdAt: Date): Promise<void> {
    try {
      await this.moodsService.recomputeDailyMood(userId, createdAt);
    } catch (e) {}
  }

  async _handleUpdateUserStatistics(entry: Entry, createdBy: User) {
    try {
      const entries = await this.entryRepo.find({ where: { userId: createdBy.id } });
      const totalEntry = entries.length;
      const totalEntryWords = entries.reduce((sum, e) => sum + e.words, 0);
      // const totalEntry = await this.entryRepo.count({ where: { userId: createdBy.id } });
      const lastEntryDayAt = entry.createdAt;
      // const totalEntryWords = (createdBy.statistics?.totalEntryWords ?? 0) + entry.words;
      const streakDays = await this.streakRepo.count({ where: { createdById: createdBy.id } });
      const lastStreak = await this.streakRepo.findOne({
        where: { createdById: createdBy.id },
        order: { entryAt: 'DESC' },
      });
      const lastStreakAt = lastStreak?.entryAt;
      createdBy.statistics ??= {};
      createdBy.statistics.totalEntry = totalEntry;
      if (lastEntryDayAt) createdBy.statistics.lastEntryDayAt = lastEntryDayAt;
      createdBy.statistics.streakDays = streakDays;
      createdBy.statistics.totalEntryWords = totalEntryWords;
      if (lastStreakAt) createdBy.statistics.lastStreakAt = lastStreakAt;

      await this.userRepo.save(createdBy);
    } catch (e) {}
  }

  @OnEvent('entry.removed', { async: true })
  async handleEntryRemovedEvent(event: EntryRemovedEvent) {
    console.log('handleEntryRemovedEvent');
    const { createdBy, entry } = event;

    await this._handleUpdateUserStatistics(entry, createdBy);

    const day = toDayString(entry.createdAt);

    const count = await this.entryRepo
      .createQueryBuilder('entry')
      .where('entry.userId = :userId', { userId: createdBy.id })
      .andWhere('DATE(entry.createdAt) = :day', { day })
      .getCount();
    if (count === 0) {
      await this.streaksService.removeForDay(createdBy.id, entry.createdAt);
    }
    await this._recomputeDailyMood(createdBy.id, entry.createdAt);
  }

  private async _handleChallengeEntryCreatedEvent(event: EntryCreatedEvent) {
    try {
      const { entry, createdBy } = event;
      await this.challengesService.trackEntryForChallenge(createdBy, entry.entryCategoryId, entry.createdAt);
    } catch (e) {}
  }

  private async _handleStreak(event: EntryCreatedEvent) {
    try {
      const { entry, createdBy } = event;
      await this.streaksService.createIfNotExists(createdBy, entry.createdAt);
    } catch (e) {}
  }

  private async _updateUserStatistics(
    createdBy: User,
    statisticsKey: keyof UserStatistics,
    statisticsValue: number | string,
    handleUserUpdated: boolean = true,
  ): Promise<void> {
    let statisticsSql: string;

    if (typeof statisticsValue === 'number') {
      statisticsSql = `
        CASE
                WHEN JSON_LENGTH(statistics) > 0 THEN JSON_SET(statistics, '$.${statisticsKey}', ${statisticsValue})
                ELSE '{"${statisticsKey}": ${statisticsValue}}'
                END
        `;
    } else if (typeof statisticsValue === 'string') {
      statisticsSql = `
        CASE
                WHEN JSON_LENGTH(statistics) > 0 THEN JSON_SET(statistics, '$.${statisticsKey}', '${statisticsValue}')
                ELSE '{"${statisticsKey}": "${statisticsValue}"}'
                END
        `;
    }

    if (!statisticsSql) return;
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({
        statistics: () => statisticsSql,
      })
      .andWhere('id= :id', { id: createdBy.id })
      .execute();
    if (handleUserUpdated) await this.handleUserUpdateEvent(createdBy.id);
  }

  @OnEvent('user.created')
  async handleUserCreatedEvent(userId: string) {
    try {
      if (Constant.ENABLE_MAUTIC) await this.mauticService.handleUserCreatedEvent(userId);
    } catch (e) {}
  }

  @OnEvent('user.updated')
  async handleUserUpdateEvent(userId: string) {
    try {
      if (Constant.ENABLE_MAUTIC) await this.mauticService.handleUserUpdateEvent(userId);
    } catch (e) {}
  }

  @OnEvent('useCase.execute')
  async handleExecuteUseCase(event: ExecuteUseCaseEvent) {
    const { useCaseId, dto, user } = event;
    console.log('handleExecuteUseCase for useCaseId:', useCaseId, 'userId:', user.id);
    await this.useCasesController.execute(useCaseId, dto, user, null);
  }

  @OnEvent('subscription.changed')
  async weekly(event: SubscriptionChangedEvent) {
    const { userId } = event;
    const useCaseId = (await this.useCaseRepo.findOneOrFail({ where: { defaultInsight: true } })).id;
    const createdBy = await this.userRepo.findOneOrFail({ where: { id: userId }, relations: { subscriptions: true } });
    const jobId = `weekly_insight_userId:${userId}_${useCaseId}`;

    // patten include jobId as prefix to remove existing job
    await this.memberQueue.removeJobs(`${jobId}*`);

    const lastTimeline: LastTimeLine = createdBy.isTeamMember
      ? {
          type: TimelineType.RELATIVE,
          days: 1,
        }
      : {
          type: TimelineType.RELATIVE,
          days: 7,
        };

    const executeUseCaseEvent: ExecuteUseCaseEvent = {
      useCaseId: useCaseId,
      dto: {
        allowNotify: true,
        timeFrame: TimeFrame.WEEKLY,
        metaData: {
          usedUserData: {
            lastTimeline,
          },
        },
        userId: createdBy.id,
      },
      user: createdBy,
    };

    const duration = createdBy.isTeamMember ? moment.duration(1, 'day') : moment.duration(1, 'week');
    console.log(`scheduling weekly ${duration} job for userId:`, userId);
    await this.memberQueue.add(Constant.MEMBER_EXECUTE_WEEKLY_USE_CASE, executeUseCaseEvent, {
      jobId: jobId,
      removeOnComplete: true,
      removeOnFail: true,
      // attempts: 4,
      delay: duration.asMilliseconds(),
    });
  }

  @OnEvent('subscription.changed')
  async monthly(event: SubscriptionChangedEvent) {
    const { userId } = event;
    const useCaseId = (await this.useCaseRepo.findOneOrFail({ where: { defaultInsight: true } })).id;
    const createdBy = await this.userRepo.findOneOrFail({ where: { id: userId }, relations: { subscriptions: true } });
    const jobId = `monthly_insight_userId:${userId}_${useCaseId}`;

    // patten include jobId as prefix to remove existing job
    await this.memberQueue.removeJobs(`${jobId}*`);

    const lastTimeline: LastTimeLine = createdBy.isTeamMember
      ? {
          type: TimelineType.RELATIVE,
          days: 3,
        }
      : {
          type: TimelineType.RELATIVE,
          months: 1,
        };

    const executeUseCaseEvent: ExecuteUseCaseEvent = {
      useCaseId: useCaseId,
      dto: {
        allowNotify: true,
        timeFrame: TimeFrame.MONTHLY,
        metaData: {
          usedUserData: {
            lastTimeline,
          },
        },
        userId: createdBy.id,
      },
      user: createdBy,
    };

    const duration = createdBy.isTeamMember ? moment.duration(3, 'days') : moment.duration(1, 'months');
    console.log('scheduling monthly job for userId:', userId);
    await this.memberQueue.add(Constant.MEMBER_EXECUTE_MONTHLY_USE_CASE, executeUseCaseEvent, {
      jobId: jobId,
      removeOnComplete: true,
      removeOnFail: true,
      delay: duration.asMilliseconds(),
    });
  }

  @OnEvent('challenge.completed', { async: true })
  async handleChallengeCompletedEvent(event: ChallengeCompletedEvent) {
    const { challenge, userChallenge, user } = event;
    const useCaseId = challenge.useCaseId;
    const startDate = userChallenge.startAt;
    const endDate = new Date();
    const filterEntryDto = {
      entryCategoryId: challenge.entryCategoryId,
      startDate,
      endDate,
      take: 1000,
    } as FilterEntryDto;
    const dto: ExecuteUseCaseDto = {
      startDate,
      endDate,
      allowNotify: true,
      metaData: {
        usedUserData: {
          filterEntryDto,
        },
      },
      userId: user.id,
    };

    await this.useCasesController.execute(useCaseId, dto, user, null);
  }
}
