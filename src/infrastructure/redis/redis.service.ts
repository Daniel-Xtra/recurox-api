import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    this.logger.log('Initializing Redis connection...');

    const redisOptions: any = {
      maxRetriesPerRequest: null,
      connectTimeout: 10000,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    const redisUrl = this.configService.get<string>('RECUROX_REDIS_URL')!;
    const disableSsl = this.configService.get<boolean>('RECUROX_REDIS_DISABLE_SSL') ?? false;

    if (!disableSsl) {
      this.logger.log('Redis SSL/TLS enabled');
      redisOptions.tls = {
        rejectUnauthorized: false,
      };
    }

    this.client = new Redis(redisUrl, redisOptions);

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.logger.error(
        `Redis connection error: ${error.message}`,
        error.stack,
      );
    });
  }

  onModuleDestroy() {
    this.logger.log('Closing Redis connection...');
    this.client.disconnect();
  }

  /**
   * Get the Redis client instance directly for advanced operations.
   */
  get clientInstance(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string | number): Promise<'OK'> {
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  /**
   * Get remaining TTL (in seconds) for a key.
   * Returns:
   * -2 if the key does not exist
   * -1 if the key exists but has no associated expire
   * >= 0 seconds otherwise
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Delete keys matching a Redis glob pattern using SCAN (safe for production).
   * Returns the number of keys deleted (best-effort).
   */
  async delByPattern(pattern: string, count = 200): Promise<number> {
    let cursor = '0';
    let deleted = 0;

    do {
      // ioredis returns [cursor, keys]

      const result = (await (this.client as any).scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        count,
      )) as [string, string[]];

      cursor = result[0];
      const keys = result[1];

      if (keys.length > 0) {
        // DEL can take multiple keys
        deleted += await this.client.del(...keys);
      }
    } while (cursor !== '0');

    return deleted;
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async flushall(): Promise<'OK'> {
    return this.client.flushall();
  }

  /**
   * Set cache with an optional TTL (default is 24 hours)
   * @param key Redis key
   * @param value Object or value to store
   * @param ttl Time To Live in seconds (default: 86400)
   */
  async setCache(key: string, value: any, ttl = 86400): Promise<'OK'> {
    const stringValue = JSON.stringify(value);
    return this.client.set(key, stringValue, 'EX', ttl);
  }

  /**
   * Get cached data with type safety and error handling
   * @param key Redis key
   */
  async getCache<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(
        `Failed to parse JSON for key "${key}": ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Delete cache data
   * @param key Redis key
   */
  async deleteCache(key: string): Promise<number> {
    return this.client.del(key);
  }

  /**
   * Set (or update) data in cache by merging with existing data if present
   * @param key Redis key
   * @param payload Data to merge or set
   * @param expiryInSeconds Optional TTL
   */
  async setDataToCache(
    key: string,
    payload: Record<string, unknown>,
    expiryInSeconds?: number,
  ): Promise<void> {
    const existData = await this.getDataFromCache(key);

    if (existData && typeof existData === 'object') {
      const newData = { ...existData, ...payload };
      await this.updateCacheData(key, newData);
      return;
    }

    await this.setCache(key, payload, expiryInSeconds || 86400);
  }

  /**
   * Fetch data from cache
   * @param key Redis key
   */
  async getDataFromCache<T>(key: string): Promise<T | null> {
    return this.getCache<T>(key);
  }

  /**
   * Update data and refresh the cache
   * @param key Redis key
   * @param payload New data
   */
  async updateCacheData(
    key: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    await this.setCache(key, payload);
    return payload;
  }
}
