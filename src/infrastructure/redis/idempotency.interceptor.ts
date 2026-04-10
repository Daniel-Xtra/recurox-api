import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { IdempotencyService } from './idempotency.service';
import { IDEMPOTENT_METADATA_KEY } from './idempotent.decorator';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private readonly idempotencyService: IdempotencyService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const options = Reflect.getMetadata(
      IDEMPOTENT_METADATA_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const {
      service,
      operation,
      header = 'x-idempotency-key',
      lockTtl,
      resultTtl,
    } = options;

    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers[header.toLowerCase()];

    // If no key is provided, we skip idempotency (optional or enforced by guard)
    if (!idempotencyKey) {
      return next.handle();
    }

    const payload = request.body;

    const existing = await this.idempotencyService.getOrSet(
      service,
      operation,
      idempotencyKey,
      payload,
      lockTtl,
    );

    if (existing) {
      if (existing.status === 'started') {
        throw new ConflictException(
          `Operation ${service}:${operation} for key ${idempotencyKey} is already in progress.`,
        );
      }
      this.logger.debug(`Returning cached result for key: ${idempotencyKey}`);
      return of(existing.result);
    }

    return next.handle().pipe(
      switchMap(async (result) => {
        await this.idempotencyService.complete(
          service,
          operation,
          idempotencyKey,
          payload,
          result,
          resultTtl,
        );
        return result;
      }),
    );
  }
}
