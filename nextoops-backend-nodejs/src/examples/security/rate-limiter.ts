import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

/**
 * Example of Distributed Rate Limiting using express-rate-limit and a Redis store.
 * This is effective in microservice environments where multiple app instances share state.
 */

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});

@Module({})
export class RateLimiterModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100, // limit each IP to 100 requests per windowMs
          standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
          legacyHeaders: false, // Disable the `X-RateLimit-*` headers
          store: new RedisStore({
            sendCommand: (...args: string[]) => redisClient.call.apply(redisClient, args),
          }),
          message: {
            statusCode: 429,
            error: 'Too Many Requests',
            message: 'You have exceeded the request limit, please try again later.',
          },
        }),
      )
      .forRoutes('*');
  }
}
