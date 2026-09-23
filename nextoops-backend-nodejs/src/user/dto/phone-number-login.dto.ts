import { IsEnum, IsString } from 'class-validator';
import { UserType } from '../enums/user-type.enum';
import { RegisterProviderType } from './social-login.dto';

export class PhoneNumberLoginDto {
  @IsString()
  phoneNumber: string;
  @IsEnum(RegisterProviderType)
  type: RegisterProviderType;
  @IsEnum(UserType)
  userType: UserType;
}
