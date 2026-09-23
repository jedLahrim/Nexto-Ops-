import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';

import { User } from '../user/entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';
import * as moment from 'moment';

@Injectable()
export class TaskSchedulingService {
  private readonly logger = new Logger(TaskSchedulingService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async dailyCron() {
    // await this._pushDailyParentNotification();
    // await this._pushDailyPartnerNotification();
  }

  async dailyMidnight() {
    await this._removeOldNotifications();
    await this._removeUsersNotLoggedInForLongTime();
    console.log('dailyMidnight cronjob pushed');
  }

  private async _removeOldNotifications() {
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    await this.notificationRepo.delete({ createdAt: LessThanOrEqual(thirtyDaysAgo) });
  }

  private async _removeUsersNotLoggedInForLongTime() {
    const longTime = moment().subtract(6, 'months').toDate();
    await this.userRepo.delete({ lastLoginAt: LessThanOrEqual(longTime) });
  }
}
