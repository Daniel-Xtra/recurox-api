import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // MS timestamp
}

export interface BlockResult {
  blocked: boolean;
  ttl?: number; // Seconds
}

@Injectable()
export class RateLimiterService implements OnModuleInit {
  private readonly logger = new Logger(RateLimiterService.name);
  private slidingWindowScript: string;
  private behaviorDetectorScript: string;

  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    this.slidingWindowScript = fs.readFileSync(
      path.join(__dirname, 'lua', 'sliding-window.lua'),
      'utf8',
    );
    this.behaviorDetectorScript = fs.readFileSync(
      path.join(__dirname, 'lua', 'behavior-detector.lua'),
      'utf8',
    );
    this.logger.log('Rate limiter Lua scripts loaded');
  }

  async checkRateLimit(
    resource: string,
    identifier: string,
    limit: number,
    ttlInMs: number,
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${resource}:${identifier}`;
    const now = Date.now();

    try {
      const result = (await this.redisService.clientInstance.eval(
        this.slidingWindowScript,
        1,
        key,
        now.toString(),
        ttlInMs.toString(),
        limit.toString(),
      )) as [number, number, number];

      const [allowed, remaining, resetTime] = result;

      return {
        allowed: allowed === 1,
        remaining,
        resetTime,
      };
    } catch (error) {
      this.logger.error(`Rate limit check failed for ${key}: ${error.message}`);
      // Fail open to avoid blocking users if Redis is down (policy decision)
      return { allowed: true, remaining: limit, resetTime: 0 };
    }
  }

  async recordFailure(
    resource: string,
    identifier: string,
    threshold: number,
    blockDurationSec: number,
    windowSec: number,
  ): Promise<BlockResult> {
    const failureKey = `failures:${resource}:${identifier}`;
    const blockedKey = `blocked:${resource}:${identifier}`;

    try {
      const result = (await this.redisService.clientInstance.eval(
        this.behaviorDetectorScript,
        2,
        failureKey,
        blockedKey,
        threshold.toString(),
        blockDurationSec.toString(),
        windowSec.toString(),
      )) as [number, number];

      const [isBlocked, ttl] = result;

      return {
        blocked: isBlocked === 1,
        ttl,
      };
    } catch (error) {
      this.logger.error(
        `Behavior detection failed for ${identifier}: ${error.message}`,
      );
      return { blocked: false };
    }
  }

  async isBlocked(resource: string, identifier: string): Promise<BlockResult> {
    const blockedKey = `blocked:${resource}:${identifier}`;
    const ttl = await this.redisService.clientInstance.ttl(blockedKey);

    return {
      blocked: ttl > 0,
      ttl: ttl > 0 ? ttl : undefined,
    };
  }
}
