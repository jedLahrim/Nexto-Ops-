import { PartialType } from '@nestjs/mapped-types';
import { PushNotificationDto } from './push-notification.dto';

export class UpdateNotificationDto extends PartialType(PushNotificationDto) {}
