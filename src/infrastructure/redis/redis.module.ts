import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { IdempotencyService } from './idempotency.service';
import { IdempotencyInterceptor } from './idempotency.interceptor';

@Global()
@Module({
  providers: [RedisService, IdempotencyService, IdempotencyInterceptor],
  exports: [RedisService, IdempotencyService, IdempotencyInterceptor],
})
export class RedisModule {}
