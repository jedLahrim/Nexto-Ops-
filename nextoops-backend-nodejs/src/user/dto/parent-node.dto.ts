import { IsEnum, IsOptional } from 'class-validator';
import { UserType } from '../../user/enums/user-type.enum';
import { UserPermissionsType } from '../enums/user-permission.enum';

export class ParentNodeDto {
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;

  @IsOptional()
  requiredPermissions: UserPermissionsType[];
}
