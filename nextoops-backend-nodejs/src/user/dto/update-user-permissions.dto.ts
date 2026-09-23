import { ArrayNotEmpty } from 'class-validator';
import { UserPermissionsType } from '../enums/user-permission.enum';

export class UpdateUserPermissionsDto {
  @ArrayNotEmpty()
  permissions: UserPermissionsType[];
}
