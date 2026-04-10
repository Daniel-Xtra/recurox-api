import { Module, Global } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { BehaviorDetectionInterceptor } from './interceptors/behavior-detection.interceptor';
import { RedisModule } from '../../infrastructure/redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [RateLimiterService, RateLimitGuard, BehaviorDetectionInterceptor],
  exports: [RateLimiterService, RateLimitGuard, BehaviorDetectionInterceptor],
})
export class RateLimiterModule {}
