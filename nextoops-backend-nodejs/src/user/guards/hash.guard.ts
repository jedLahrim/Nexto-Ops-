import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { isValidateHash } from '../../commons/utils';

@Injectable()
export class HashGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;
    // 1. authorization exist then skip for the next "AuthGuard"
    if (headers.authorization) return true;
    // 2. validate the hash
    return isValidateHash(headers.hash);
  }
}
