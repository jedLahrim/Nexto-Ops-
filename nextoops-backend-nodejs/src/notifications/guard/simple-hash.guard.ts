import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as sha256 from 'sha256';
import { ERR_UNAUTHORIZED } from '../../commons/errors/errors-codes';

@Injectable()
export class SimpleHashGuard implements CanActivate {
  private readonly _webhookHash: string;

  constructor() {
    const secretKey = process.env.MAUTIC_HASH_WEBHOOK;
    if (secretKey) this._webhookHash = sha256(secretKey);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    const clientHash: string = headers?.hash;
    if (!clientHash || clientHash !== this._webhookHash) {
      throw new UnauthorizedException(ERR_UNAUTHORIZED);
    }

    return true;
  }
}
