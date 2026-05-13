import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PaginatedResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

function isPaginatedResponse<T>(
  value: unknown,
): value is PaginatedResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value
  );
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        // Si la respuesta ya tiene forma { data, meta }, pasar sin modificar
        if (isPaginatedResponse(value)) {
          return value;
        }

        return {
          data: value,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
