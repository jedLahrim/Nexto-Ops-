import { IsBoolean } from 'class-validator';

export class UpdateUserVipDto {
  @IsBoolean()
  isVip: boolean;
}
