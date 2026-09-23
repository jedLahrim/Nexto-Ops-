import { IsString } from 'class-validator';

export class SetFocusDto {

  @IsString()
  userId: string;
}
