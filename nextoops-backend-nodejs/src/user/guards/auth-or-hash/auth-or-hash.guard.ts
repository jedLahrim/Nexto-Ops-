import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { HashGuard } from '../hash.guard';

@Injectable()
export class AuthOrHashGuard implements CanActivate {
  constructor(
    private readonly hashGuard: HashGuard,
    private readonly jwtAuthGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let jwtAuthGuardResult;
    let hashGuardResult;

    try {
      jwtAuthGuardResult = await this.jwtAuthGuard.canActivate(context);
    } catch (e) {}
    try {
      hashGuardResult = await this.hashGuard.canActivate(context);
    } catch (e) {}

    return jwtAuthGuardResult || hashGuardResult;
  }
}
