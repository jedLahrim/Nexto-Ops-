import { Test, TestingModule } from '@nestjs/testing';
import { CacheAsideService } from '../caching/cache-aside-pattern';
import { RedisCacheService } from '../caching/redis-cache.service';

/**
 * Example of a Unit Test with Mocks.
 * Focuses on testing a single class in isolation.
 */

describe('CacheAsideService', () => {
  let service: CacheAsideService;
  let redisMock: Partial<RedisCacheService>;

  beforeEach(async () => {
    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheAsideService, { provide: RedisCacheService, useValue: redisMock }],
    }).compile();

    service = module.get<CacheAsideService>(CacheAsideService);
  });

  it('should return cached data if present (Cache Hit)', async () => {
    const mockUser = { id: '1', name: 'Test' };
    (redisMock.get as jest.Mock).mockResolvedValue(mockUser);

    const result = await service.getUserData('1');

    expect(result).toEqual(mockUser);
    expect(redisMock.get).toHaveBeenCalledWith('user:1');
  });
});
