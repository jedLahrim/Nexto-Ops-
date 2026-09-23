import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserType } from '../../user/enums/user-type.enum';

export class CreateFaqDto {
  @IsString()
  question: string;
  @IsString()
  answer: string;
  @IsOptional()
  @IsEnum(UserType)
  userType: UserType;
}
