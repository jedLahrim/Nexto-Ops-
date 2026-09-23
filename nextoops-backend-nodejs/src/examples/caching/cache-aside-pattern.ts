import { Injectable } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

/**
 * Example of the Cache-Aside Pattern (Lazy Loading).
 * The application first checks the cache. If data is not there, it fetches from the DB and stores it in the cache.
 */

@Injectable()
export class CacheAsideService {
    constructor(private readonly cache: RedisCacheService) { }

    async getUserData(userId: string) {
        const cacheKey = `user:${userId}`;

        // 1. Try to get from cache
        let data = await this.cache.get<any>(cacheKey);

        if (!data) {
            console.log('Cache miss! Fetching from Database...');

            // 2. Fetch from Database (mock)
            data = await this.fetchFromDatabase(userId);

            // 3. Store in cache for future requests
            await this.cache.set(cacheKey, data, 3600); // 1-hour TTL
        } else {
            console.log('Cache hit!');
        }

        return data;
    }

    async updateUserData(userId: string, newData: any) {
        // 1. Update Database (mock)
        await this.updateDatabase(userId, newData);

        // 2. Invalidate cache (Write-through or Cache-invalidation)
        // Deleting is safer than updating to avoid race conditions.
        await this.cache.del(`user:${userId}`);
    }

    private async fetchFromDatabase(id: string) {
        return { id, name: 'John Doe', email: 'john@example.com' };
    }

    private async updateDatabase(id: string, data: any) {
        // DB logic...
    }
}
