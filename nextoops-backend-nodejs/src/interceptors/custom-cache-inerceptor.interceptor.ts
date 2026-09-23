import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CustomCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request?.user as User;
    // Check if the 'skip-cache' header is set to 'true'
    const skipCache =
      request.headers['skip-cache'] === 'true' ||
      request.params['skipCache'] === 'true' ||
      request.body['skipCache'] == true ||
      request.query['skipCache'] === 'true' ||
      (user?.allowSkipCache && user?.isTeamMember) ||
      process.env.SKIP_CACHE === 'true';
    if (skipCache) {
      // skip caching
      return undefined;
    }
    // Otherwise, use default caching behavior
    return super.trackBy(context);
  }
}

// @Injectable()
// export class CustomCacheInterceptor {
//   trackBy(context: ExecutionContext): string | undefined {
//     const request = context.switchToHttp().getRequest<Request>();
//     // Check if the 'skip-cache' header is set to 'true'
//     const skipCache = request.headers['skip-cache'] === 'true';
//     if (skipCache) {
//       // skip caching
//       return undefined;
//     }
//     // Otherwise, use default caching behavior
//     // return super.trackBy(context);
//     return undefined;
//   }
// }
