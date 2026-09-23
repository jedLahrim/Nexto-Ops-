import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * A reusable Redis Service using ioredis.
 * Provides basic get, set, and delete operations with time-to-live support.
 */

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
    private client: Redis;

    onModuleInit() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
        });
    }

    onModuleDestroy() {
        this.client.disconnect();
    }

    async set(key: string, value: any, ttlInSeconds?: number) {
        const stringValue = JSON.stringify(value);
        if (ttlInSeconds) {
            await this.client.set(key, stringValue, 'EX', ttlInSeconds);
        } else {
            await this.client.set(key, stringValue);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
    }

    async del(key: string) {
        await this.client.del(key);
    }

    async flushAll() {
        await this.client.flushall();
    }
}
