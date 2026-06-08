import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
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
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<unknown> {
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const httpCode = this.reflector.get<number>('__httpCode__', handler);

    return next.handle().pipe(
      map((value) => {
        // Si el httpCode del decorador es 204, o response.statusCode es 204, no transformar para evitar enviar un body
        if (httpCode === 204 || response?.statusCode === 204) {
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
