import { CreateSuperUserDto } from './create-super-user.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserType } from '../enums/user-type.enum';

export class LoginSuperUserDto extends CreateSuperUserDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  userType: UserType;
}
