import { Controller } from '@nestjs/common';
import { TaskSchedulingService } from './task-scheduling.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('task-scheduling')
export class TaskSchedulingController {
  constructor(private readonly taskSchedulingService: TaskSchedulingService) {}

  // TODO we need to add timeZone for each user and let CRON work EVERY HOUR and check for 8PM of each users

  @Cron(CronExpression.EVERY_DAY_AT_8PM, { timeZone: 'Europe/London' })
  dailyCron() {
    return this.taskSchedulingService.dailyCron();
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM, { timeZone: 'Europe/London' })
  dailyMidnight() {
    return this.taskSchedulingService.dailyMidnight();
  }
}
