import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { RedisCacheService } from '../caching/redis-cache.service';

/**
 * Example of Idempotency Middleware/Interceptor.
 * It ensures that performing the same operation multiple times has the same result as a single time.
 * Essential for payment processing and non-idempotent HTTP methods like POST.
 */

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
    constructor(private redis: RedisCacheService) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const idempotencyKey = request.headers['x-idempotency-key'];

        if (!idempotencyKey) {
            return next.handle(); // If no key provided, treat as normal request
        }

        // Check if we've already processed this key
        const cachedResponse = await this.redis.get(`idempotency:${idempotencyKey}`);
        if (cachedResponse) {
            console.log('IDEMPOTENCY HIT: Returning cached response');
            return of(cachedResponse);
        }

        // Process request and cache the result
        return next.handle().pipe(
            // Note: In real scenarios, you'd handle caching the successful response here
        );
    }
}
