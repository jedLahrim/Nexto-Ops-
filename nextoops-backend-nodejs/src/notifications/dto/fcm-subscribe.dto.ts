import { IsString } from 'class-validator';

export class FcmSubscribeDto {
  @IsString()
  topic: string;
}
