import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { PartialType } from '@nestjs/mapped-types';
import { UserType } from '../enums/user-type.enum';

export class CreateGuestDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserType)
  userType: UserType;
}
