import { IsEnum, IsOptional } from 'class-validator';
import { UserType } from '../enums/user-type.enum';
import { CUPermissionUserDto } from './c-u-permission-user.dto';

export class SetToDefaultPermissionUserDto extends CUPermissionUserDto {
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;

  @IsOptional()
  userId?: string;

  @IsOptional()
  userIds?: string[];

  @IsOptional()
  emails?: string[];
}
