import { IsOptional } from 'class-validator';
import { NotificationChannelKey } from '../enum/notification-channel-key.enum';
import { NotificationLayout } from '../enum/notification-layout';
import { Constant } from '../../commons/constant';

export class NotificationContentDto {
  @IsOptional()
  id?: number = Constant.getIdNumber();
  @IsOptional()
  channelKey?: NotificationChannelKey = NotificationChannelKey.CHANNEL_BASIC;
  @IsOptional()
  displayOnForeground?: boolean = true;
  @IsOptional()
  showWhen?: boolean = true;
  @IsOptional()
  autoDismissible?: boolean = true;
  @IsOptional()
  privacy?: string = 'Private';
  @IsOptional()
  bigPicture?: string;
  @IsOptional()
  payload?: Record<string, any>;
  @IsOptional()
  notificationLayout?: NotificationLayout = NotificationLayout.Default;
  @IsOptional()
  groupKey?: string;
  @IsOptional()
  largeIcon?: string;
  @IsOptional()
  summary?: string;
  @IsOptional()
  roundedLargeIcon?: boolean = true;
  @IsOptional()
  wakeUpScreen?: boolean;
  @IsOptional()
  fullScreenIntent?: boolean;
  @IsOptional()
  criticalAlert?: boolean;
  @IsOptional()
  roundedBigPicture?: boolean;

  constructor(object?: Partial<NotificationContentDto>) {
    this.notificationLayout = object?.bigPicture ? NotificationLayout.BigPicture : NotificationLayout.Default;
    Object.assign(this, object);
  }
}
// constructor(object?: Partial<User>) {
//   Object.assign(this, object);
// }