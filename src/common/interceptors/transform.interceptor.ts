import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponse } from '../../definition';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<any>();
    const statusCode = response.statusCode;

    // Skip transformation for metrics and health endpoints
    if (request.url.includes('metrics') || request.url.includes('health')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: any): IResponse<T> => {
        const result: any = {
          success: true,
          statusCode,
          message: data?.message || 'Operation successful',
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        const isStandard = data && typeof data === 'object' && 'success' in data;

        if (isStandard) {
          return { ...result, ...data };
        }

        if (data && typeof data === 'object' && 'meta' in data) {
          result.data = data.data;
          result.meta = data.meta;
        } else if (data !== undefined && data !== null) {
          result.data = data;
        }

        return result;
      }),
    );
  }
}
