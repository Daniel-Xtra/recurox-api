import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterService } from '../rate-limiter.service';
import {
  RATE_LIMIT_METADATA_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  // Default global limits if none specified
  private globalLimit = 100;
  private globalTtl = 60; // seconds

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiterService: RateLimiterService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 1. Identify Client
    const clientId = this.getClientIdentifier(request);
    const clientIp = this.getClientIp(request);

    // 3. Get Rate Limit Options
    const endpointOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_METADATA_KEY,
      context.getHandler(),
    );

    const limit = endpointOptions?.limit || this.globalLimit;
    const ttl = (endpointOptions?.ttl || this.globalTtl) * 1000; // to ms
    const resource = endpointOptions?.resource || context.getClass().name;

    // 2. Check Behavior Detection (Block list)
    // We check if the IP or User is explicitly blocked due to previous failures
    const blockedStatus = await this.rateLimiterService.isBlocked(
      'global',
      clientId,
    );
    if (blockedStatus.blocked) {
      this.logger.warn(
        `Blocked request from ${clientId}. TTL: ${blockedStatus.ttl}s`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'Your access is temporarily suspended due to suspicious activity.',
          retryAfter: blockedStatus.ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }


    // 4. Execute Rate Limit Check
    const result = await this.rateLimiterService.checkRateLimit(
      resource,
      clientId,
      limit,
      ttl,
    );

    // 5. Set Headers
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      response.setHeader('Retry-After', retryAfter);

      this.logger.verbose(`Rate limit exceeded for ${clientId} on ${resource}`);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getClientIdentifier(request: any): string {
    // If authenticated, use user ID
    if (request.user?.externalId) {
      return `user:${request.user.externalId}`;
    }

    // If API key is present, use that
    const apiKey = request.headers['x-api-key'];
    if (apiKey) {
      return `apikey:${apiKey}`;
    }

    // Fallback to IP
    return `ip:${this.getClientIp(request)}`;
  }

  private getClientIp(request: any): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    return request.ip || request.connection.remoteAddress;
  }
}
