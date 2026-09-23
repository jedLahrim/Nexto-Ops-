import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/enum/notification-type.enum';

@Processor('notify_me_later_queue')
export class NotifyLaterProcessor {
  constructor(private notificationService: NotificationsService) {}

  @Process('notify_me_later')
  async notifyLaterOperationJob(job: Job) {
    return this.notificationService.pushNotification({
      userId: job.data.userId,
      type: NotificationType.INFO,
      notification: job.data.notification,
      data: job.data.data,
    });
  }
}
