import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RateLimiterService } from '../rate-limiter.service';

@Injectable()
export class BehaviorDetectionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(BehaviorDetectionInterceptor.name);

  // Configuration for behavior detection
  private readonly failureThreshold = 5;
  private readonly blockDuration = 3600; // 1 hour in seconds
  private readonly window = 600; // 10 minutes in seconds

  constructor(private readonly rateLimiterService: RateLimiterService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const clientId = this.getClientIdentifier(request);

    return next.handle().pipe(
      catchError((error) => {
        // We only track specific failures that might indicate an attack
        // E.g., Unauthorized, Forbidden, or too many requests (trying to bypass?)
        if (error instanceof HttpException) {
          const status = error.getStatus();
          if (status === 401 || status === 403) {
            void this.handleFailure(clientId);
          }
        }
        return throwError(() => error);
      }),
    );
  }

  private async handleFailure(clientId: string) {
    const result = await this.rateLimiterService.recordFailure(
      'global',
      clientId,
      this.failureThreshold,
      this.blockDuration,
      this.window,
    );

    if (result.blocked) {
      this.logger.error(
        `Suspicious activity detected. Client ${clientId} is now blocked for ${result.ttl}s`,
      );
    }
  }

  private getClientIdentifier(request: any): string {
    // Shared logic with Guard (ideally move to a utility)
    if (request.user?.externalId) {
      return `user:${request.user.externalId}`;
    }
    const apiKey = request.headers['x-api-key'];
    if (apiKey) {
      return `apikey:${apiKey}`;
    }
    const forwardedFor = request.headers['x-forwarded-for'];
    const ip = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : request.ip || request.connection.remoteAddress;
    return `ip:${ip}`;
  }
}
