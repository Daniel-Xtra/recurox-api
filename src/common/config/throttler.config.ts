import { ExecutionContext } from '@nestjs/common';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { seconds } from '@nestjs/throttler';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const optimizedThrottlerConfig = {
  throttlers: [
    // Global default limit
    {
      name: 'global',
      limit: 100,
      ttl: seconds(60),
    },
    // Stricter limit for sensitive operations (Auth)
    {
      name: 'auth',
      limit: 10,
      ttl: seconds(60),
      skipIf: (context: ExecutionContext) => {
        const request = context
          .switchToHttp()
          .getRequest<{ route?: { path?: string }; url?: string }>();
        const path = String(request.route?.path || request.url || '');
        // Only apply this throttler to /auth/ routes
        return !path.includes('/auth/');
      },
    },
  ],
  storage: new ThrottlerStorageRedisService(REDIS_URL),
};
