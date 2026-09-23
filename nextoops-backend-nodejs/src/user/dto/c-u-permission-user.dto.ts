import { IsEnum, IsOptional } from 'class-validator';
import { UserType } from '../enums/user-type.enum';

export class CUPermissionUserDto {
  permissions: string[];

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  userId?: string;

  @IsOptional()
  emails?: string[];
}
