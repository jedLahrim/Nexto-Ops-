import { NotificationType } from '../enum/notification-type.enum';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationContentDto } from './notification-content.dto';
import { NotificationActionButtonKey } from '../enum/notification-actipn-button-key.enum';

export class NotificationActionButtonDto {
  @IsOptional()
  key?: NotificationActionButtonKey;
  @IsOptional()
  label?: string;
  @IsOptional()
  actionType?: string;
  @IsOptional()
  isDangerousOption?: string;
  @IsOptional()
  autoDismissible?: string;
}

export class NotificationScheduleDto {
  @IsOptional()
  year?: number;
  @IsOptional()
  month?: number;
  @IsOptional()
  day?: number;
  @IsOptional()
  hour?: number;
  @IsOptional()
  minute?: number;
  @IsOptional()
  second?: number;
  @IsOptional()
  millisecond?: number;
  @IsOptional()
  timeZone?: string;
}

export class NotificationDataDto {
  content?: NotificationContentDto;
  actionButtons?: NotificationActionButtonDto[];
  schedule?: NotificationScheduleDto;
  localizations?: NotificationLocalizationDto;
}

export class NotificationDto {
  @IsString()
  title: string;
  @IsString()
  body: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  constructor(title: string, body: string, imageUrl?: string) {
    this.title = title;
    this.body = body;
    this.imageUrl = imageUrl;
  }
}

export class NotificationLocalizationDto {
  @IsString()
  title: string;
  @IsString()
  body: string;

  @IsOptional()
  bigPicture?: string;
  @IsOptional()
  largeIcon?: string;
  @IsOptional()
  summary?: string;

  @IsOptional()
  // example: {"AGREED1":"Estoy de acuerdo"}
  // AGREED1 which refer to key in actionButtons
  buttonLabels?: Record<string, string>;

  constructor(object?: Partial<PushNotificationDto>) {
    Object.assign(this, object);
  }
}

export class PushNotificationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsArray()
  userIds?: string[];

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsBoolean()
  mutable_content?: boolean = true;

  @IsOptional()
  @IsBoolean()
  silently?: boolean = false;

  @IsOptional()
  @IsArray()
  tokens?: string[] = [];

  @IsOptional()
  @IsString()
  topic?: string;

  @IsNotEmpty()
  notification: NotificationDto;

  @IsOptional()
  data?: NotificationDataDto;

  @IsOptional()
  priority?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  isDemo?: boolean = false;

  @IsOptional()
  @IsBoolean()
  webhook?: boolean = false;

  constructor(object?: Partial<PushNotificationDto>) {
    Object.assign(this, object);
  }
}

class NotificationLocaleDto {
  @IsString()
  titleAlias: string;
  @IsString()
  bodyAlias: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  constructor(object?: Partial<NotificationLocaleDto>) {
    Object.assign(this, object);
  }
}

export class PushLocaleNotificationDto {
  @IsOptional()
  userId: string;

  @IsOptional()
  @IsBoolean()
  mutable_content?: boolean = true;

  @IsOptional()
  @IsBoolean()
  silently?: boolean = false;

  @IsOptional()
  @IsArray()
  tokens?: string[] = [];

  @IsNotEmpty()
  notification: NotificationLocaleDto;

  @IsOptional()
  data?: NotificationDataDto;

  @IsOptional()
  priority?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  isDemo?: boolean = false;

  constructor(object?: Partial<PushNotificationDto>) {
    Object.assign(this, object);
  }
}
