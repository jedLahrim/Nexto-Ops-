import { CanActivate, ExecutionContext, mixin, Type, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { User } from '../entities/user.entity';
import { AppError } from '../../commons/errors/app-error';
import { ERR_PERMISSIONS_UNAUTHORIZED } from '../../commons/errors/errors-codes';
import { UserType } from '../enums/user-type.enum';

export const UserTypeGuard = (allowedUserTypes: UserType[]): Type<CanActivate> => {
  class UserTypeGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
      const request = context.switchToHttp().getRequest();
      const user: User = request.user;
      const userType = user?.type;
      if (userType && allowedUserTypes.includes(userType)) return true;
      else
        throw new UnauthorizedException(
          new AppError(ERR_PERMISSIONS_UNAUTHORIZED, {
            allowedUserTypes: allowedUserTypes,
          }),
        );
    }
  }

  return mixin(UserTypeGuardMixin);
};
