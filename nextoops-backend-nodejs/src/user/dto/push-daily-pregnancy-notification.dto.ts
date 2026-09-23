import { IsString } from 'class-validator';

export class PushDailyPregnancyNotificationDto {
  @IsString()
  userId: string;
}
