import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { NotificationsService } from '../../notifications/notifications.service';
import Bull, { Job, Queue } from 'bull';
import { NotificationType } from '../../notifications/enum/notification-type.enum';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Constant } from '../../commons/constant';
import { NotificationDto, PushNotificationDto } from '../../notifications/dto/push-notification.dto';
import { I18nService } from 'nestjs-i18n';
import * as moment from 'moment';
import { Post } from '../../posts/entities/post.entity';
import { TranslateOptions } from 'nestjs-i18n/dist/services/i18n.service';
import { WeekDays } from '../enums/week-days.enum';
import { AppRoutes } from '../../commons/app.routes';
import { NotificationContentDto } from '../../notifications/dto/notification-content.dto';
import { ExecuteUseCaseEvent } from '../../event-listeners/events/execute-use-case.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Entry } from '../../entries/entities/entry.entity';
import { User } from '../entities/user.entity';
import { v4 as uuid } from 'uuid';

@Processor(Constant.MEMBER_QUEUE)
export class MemberQueueProcessor {
  constructor(
    private notificationsService: NotificationsService,
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    @InjectRepository(Entry)
    private entryRepo: Repository<Entry>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectQueue(Constant.MEMBER_QUEUE)
    private queue: Queue,
    private readonly i18n: I18nService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Process(Constant.MEMBER_PUSH_NOTIFICATION_AFTER_30_MIN_OF_REGISTER)
  async pushNotificationAfter30min(job: Job<PushNotificationDto>) {
    await this._pushNotification(job, true);
    // await this._schedulePushNotificationNextDay(job);
  }

  @Process(Constant.MEMBER_EXECUTE_WEEKLY_USE_CASE)
  async executeWeeklyUseCase(job: Job<ExecuteUseCaseEvent>) {
    const { dto, useCaseId } = job.data;

    const user = await this.userRepo.findOne({ where: { id: dto.userId }, relations: { subscriptions: true } });

    const isPremium = user.isPremium();
    if (!isPremium) return;

    const lastWeek = user.isTeamMember ? moment().subtract(1, 'day').toDate() : moment().subtract(1, 'week').toDate();
    const hasEntries = await this.entryRepo.exists({
      where: {
        userId: user.id,
        createdAt: MoreThanOrEqual(lastWeek),
      },
    });

    if (hasEntries) {
      this.eventEmitter.emit('useCase.execute', job.data);
      // console.log('Executing weekly use case for job:', job.id);
    }

    await this._scheduleNextWeekUseCase(job, user);
  }

  private async _scheduleNextWeekUseCase(job: Job<ExecuteUseCaseEvent>, user: User) {
    const data = job.data;
    // const timeString = user.isDeveloper ? '5min' : user.isTeamMember ? '1day' : Constant.scheduleTimes.AFTER_WEEK;
    const duration = user.isTeamMember ? moment.duration(1, 'day') : moment.duration(1, 'week');
    console.log(`scheduling weekly ${duration} job for userId:`, user.id, ' isDeveloper:', user.isDeveloper);
    await this.queue.add(Constant.MEMBER_EXECUTE_WEEKLY_USE_CASE, data, {
      jobId: `weekly_insight_userId:${user.id}_${data.useCaseId}_${uuid()}`,
      removeOnComplete: true,
      removeOnFail: true,
      // attempts: 4,
      delay: duration.asMilliseconds(),
    });
  }

  @Process(Constant.MEMBER_EXECUTE_MONTHLY_USE_CASE)
  async executeMonthlyUseCase(job: Job<ExecuteUseCaseEvent>) {
    const { dto, useCaseId } = job.data;

    const user = await this.userRepo.findOne({ where: { id: dto.userId }, relations: { subscriptions: true } });

    const isPremium = user.isPremium();
    if (!isPremium) return;

    const lastMonth = user.isTeamMember ? moment().subtract(3, 'day').toDate() : moment().subtract(1, 'month').toDate();
    const hasEntries = await this.entryRepo.exists({
      where: {
        userId: user.id,
        createdAt: MoreThanOrEqual(lastMonth),
      },
    });

    if (hasEntries) {
      this.eventEmitter.emit('useCase.execute', job.data);
      // console.log('Executing monthly use case for job:', job.id);
    }

    await this._scheduleNextMonthUseCase(job, user);
  }

  private async _scheduleNextMonthUseCase(job: Job<ExecuteUseCaseEvent>, user: User) {
    const data = job.data;
    const duration = user.isTeamMember ? moment.duration(3, 'days') : moment.duration(1, 'months');
    await this.queue.add(Constant.MEMBER_EXECUTE_MONTHLY_USE_CASE, data, {
      jobId: `monthly_insight_userId:${data.user.id}_${data.useCaseId}_${uuid()}`,
      removeOnComplete: true,
      removeOnFail: true,
      // attempts: 4,
      delay: duration.asMilliseconds(),
    });
  }

  // private async _schedulePushNotificationNextDay(job: Job<PushNotificationDto>) {
  //   const isDemo: boolean = job.data['isDemo'];
  //   const notificationData: PushNotificationDto = {
  //     notification: this.getNotificationDto(
  //       'locale.notification_title_after_nothing_added_24_hour_of_welcome',
  //       'locale.notification_body_after_nothing_added_24_hour_of_welcome',
  //     ),
  //     data: {
  //       content: new NotificationContentDto({}),
  //     },
  //     userId: job.data.userId,
  //     isDemo,
  //   };
  //   // add Queue to push notification Next day (24h)
  //   await this._addQueue(Constant.PARENT_PUSH_NOTIFICATION_AFTER_24_HOURS_OF_WELCOME, notificationData, {
  //     delay: toMs(isDemo ? Constant.demoScheduleTimes.AFTER_24H : Constant.scheduleTimes.AFTER_24H),
  //     jobId: `next_day_${job.data.userId}`,
  //   });
  // }

  /*@Process(Constant.PARENT_PUSH_NOTIFICATION_AFTER_24_HOURS_OF_WELCOME)
  async pushNotificationNextDay(job: Job<PushNotificationDto>) {
    // check if nothing added daily note or tracking
    const nothingAdded = await this._noNotesOrTrackingAdded(job.data.userId);
    if (nothingAdded) {
      // nothing added in next day (24h)
      await this._pushNotification(job, true);
      await this._schedulePushNotificationForNextWeeks(job);
    }
  }*/

  /*@Process(Constant.PARENT_PUSH_NOTIFICATION_AFTER_24_HOURS_SOMETHING_ADDED)
  async pushNotificationAfter24HoursSomethingAdded(job: Job<PushNotificationDto>) {
    await this._pushNotification(job, true);
  }*/

  /*@Process(Constant.ADMIN_PUSH_NOTIFICATION_ON_WEEKEND_OBJECTIVE_REACHED)
  async pushNotificationForAdminOnWeekendTrackingObjectiveReached(job: Job<PushNotificationDto>) {
    await this._pushNotification(job, false);
  }*/

  /*private async _schedulePushNotificationNextDayAfter24Hours(
    job: Job<PushNotificationDto>,
  ) {
    const isDemo: boolean = job.data['isDemo'];
    const notificationType = NotificationType.REDIRECT;
    // add Queue to push notification Next day if nothing added
    const notificationData: PushNotificationDto = {
      notification: this.getNotificationDto(
        'locale.notification_title_after_nothing_added_24_hour_of_last_24_hour',
        'locale.notification_body_after_nothing_added_24_hour_of_last_24_hour',
      ),
      // TODO: redirect to daily insight article with example of ADHD
      data: Constant.getNotificationData(null, {
        route: `${AppRoutes.BROWSE_URL}?url=${Constant.POST_URL_CHILD_WITH_SIMILAR_ADHD}`,
        notificationType,
      }),
      type: notificationType,
      userId: job.data.userId,
      isDemo,
    };

    await this._addQueue(
      Constant.PUSH_NOTIFICATION_AFTER_NOTHING_ADDED_24_HOURS_OF_LAST_24_HOURS,
      notificationData,
      {
        delay: toMs(
          isDemo
            ? Constant.demoScheduleTimes.AFTER_24H
            : Constant.scheduleTimes.AFTER_24H,
        ),
        jobId: `next_day_after_24h_${job.data.userId}`,
      },
    );
  }*/

  /*@Process(Constant.PARENT_PUSH_NOTIFICATION_AFTER_3DAYS_SOMETHING_ADDED)
  async pushNotificationAfterNext3Days(job: Job<PushNotificationDto>) {
    const nothingAdded = await this._noNotesOrTrackingAdded(job.data.userId);
    if (!nothingAdded) {
      await this._pushNotification(job, true);
    }
  }*/

  /*@Process(Constant.PARENT_PUSH_NOTIFICATION_AFTER_NOTHING_ADDED_24_HOURS_OF_LAST_24_HOURS)
  async pushNotificationNextDayAfter24Hours(job: Job<PushNotificationDto>) {
    const nothingAdded = await this._noNotesOrTrackingAdded(job.data.userId);
    if (nothingAdded) {
      await this._pushNotification(job, true);
      await this._schedulePushNotificationForNextWeeks(job);
    }
  }*/

  /*@Process(Constant.PARENT_PUSH_NOTIFICATION_AFTER_NOTHING_ADDED_FOR_NEXT_WEEK)
  async pushNotificationForNextWeek(job: Job<PushNotificationDto>) {
    const nothingAdded = await this._noNotesOrTrackingAdded(job.data.userId);
    if (nothingAdded) {
      await this._pushNotification(job, true);
    }
  }*/

  private async _pushNotification(job: Job<PushNotificationDto>, skipSaving?: boolean) {
    // const pushNotificationDto = job.data;
    // console.log(`notification:`, pushNotificationDto.notification.title, pushNotificationDto.notification.body);
    await this.notificationsService.pushNotification(job.data, skipSaving);
  }

  private async _getPostSample(): Promise<Post> {
    return this.postRepo
      .createQueryBuilder('post')
      .orderBy('RAND()')
      .leftJoinAndSelect('post.primaryAttachment', 'primaryAttachment')
      .getOne();
  }

  private getNotificationDto(titleKey: string, bodyKey: string, options?: TranslateOptions): NotificationDto {
    return {
      title: this.i18n.t(titleKey, options),
      body: this.i18n.t(bodyKey, options),
    };
  }

  private _getScheduledNextDay(
    today: moment.Moment,
    dayOfWeek: WeekDays,
    hours: number = today.hour(),
    minutes: number = today.minute(),
    seconds: number = today.second(),
  ): moment.Moment {
    const nextDay = moment(today).day(dayOfWeek).add(1, 'weeks');
    // Set the specified time
    return nextDay.hour(hours).minute(minutes).seconds(seconds);
  }

  private async _deleteQueue(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) await job.remove();
  }

  private async _schedulePushNotificationForNextWeeks(job: Bull.Job<PushNotificationDto>) {
    const isDemo: boolean = job.data['isDemo'];
    //const postSample = await this._getPostSample();
    const notificationType = NotificationType.REDIRECT;
    // add Queue to push notification in the next week
    const notificationData: PushNotificationDto = {
      notification: this.getNotificationDto(
        'locale.notification_title_nothing_added_for_next_weekend',
        'locale.notification_body_nothing_added_for_next_weekend',
      ),
      data: {
        content: new NotificationContentDto({
          payload: {
            route: AppRoutes.HELP,
            notificationType,
          },
        }),
      },
      type: notificationType,
      userId: job.data.userId,
      isDemo,
    };

    // add queue to push notification for next week
    await this.queue.add(Constant.PARENT_PUSH_NOTIFICATION_AFTER_NOTHING_ADDED_FOR_NEXT_WEEK, notificationData, {
      delay: (isDemo ? moment.duration(5, 's') : moment.duration(1, 'week')).asMilliseconds(),
      jobId: `on_weekend_${job.data.userId}`,
      removeOnComplete: true,
      removeOnFail: true,
      // attempts: 4,
    });
  }
}
