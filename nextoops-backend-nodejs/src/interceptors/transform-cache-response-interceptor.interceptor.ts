import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class TransformCacheResponseInterceptor implements NestInterceptor {
  intercept<T>(context: ExecutionContext, next: CallHandler): Observable<Record<string, T>> {
    return next.handle().pipe(
      map((data) => {
        // Apply instanceToPlain to the final returned data
        return instanceToPlain(data);
      }),
    );
  }
}
