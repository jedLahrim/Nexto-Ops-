import { DeviceType } from '../enum/device-type.enum';
import { IsEnum, IsString } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  fcmToken: string;
  @IsEnum(DeviceType)
  deviceType: DeviceType;
}
