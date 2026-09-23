import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppError } from '../../commons/errors/app-error';
import { ERR_EXPIRED_TOKEN_OR_INVALID } from '../../commons/errors/errors-codes';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await (super.canActivate(context) as Promise<boolean>);
    } catch (e) {
      throw new UnauthorizedException(new AppError(ERR_EXPIRED_TOKEN_OR_INVALID));
    }
  }
}

@Injectable()
export class JwtGetUserGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await (super.canActivate(context) as Promise<boolean>);
    } catch (e) {
      return true;
    }
  }
}
