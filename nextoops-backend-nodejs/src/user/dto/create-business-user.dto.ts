import { IsEnum, IsIn } from 'class-validator';
import { UserType } from '../enums/user-type.enum';
import { CreateSuperUserDto } from './create-super-user.dto';

export class CreateBusinessUserDto extends CreateSuperUserDto {
  @IsEnum(UserType)
  @IsIn([UserType.ORGANIZATION, UserType.REFERRAL])
  userType: UserType;
}
