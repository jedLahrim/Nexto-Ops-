import { IsString } from 'class-validator';

export class MagicLoginDto {
  @IsString()
  userId: string;
}
