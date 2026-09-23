import { CanActivate, ExecutionContext, mixin, Type, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { User } from '../entities/user.entity';
import { UserPermissionsType } from '../enums/user-permission.enum';
import { AppError } from '../../commons/errors/app-error';
import { ERR_PERMISSIONS_UNAUTHORIZED } from '../../commons/errors/errors-codes';

export const PermissionGuard = (permission: UserPermissionsType): Type<CanActivate> => {
  class PermissionGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
      const request = context.switchToHttp().getRequest();
      const user: User = request.user;
      if (user?.permissions?.includes(permission) ?? false) return true;
      else
        throw new UnauthorizedException(
          new AppError(ERR_PERMISSIONS_UNAUTHORIZED, {
            requiredPermissions: [permission],
          }),
        );
    }
  }

  return mixin(PermissionGuardMixin);
};
