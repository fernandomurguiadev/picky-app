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

function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value
  );
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<unknown> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((value) => {
        // Si la respuesta es 204 No Content, no transformar para evitar enviar un body
        if (response?.statusCode === 204) {
          return value;
        }

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
