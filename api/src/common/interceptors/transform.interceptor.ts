import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

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
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const httpCode = this.reflector.get<number>('__httpCode__', handler);

    // Extraemos el rol del JWT inyectado en request.user
    const role = request?.user?.role;

    return next.handle().pipe(
      map((value) => {
        // Si el httpCode del decorador es 204, o response.statusCode es 204, no transformar para evitar enviar un body
        if (httpCode === 204 || response?.statusCode === 204) {
          return value;
        }

        const serializeOptions = {
          groups: role ? [role] : [],
          excludeExtraneousValues: false, // Permitir campos sin decorar
        };

        // Si la respuesta ya tiene forma { data, meta }, serializamos solo el array data
        if (isPaginatedResponse(value)) {
          return {
            ...value,
            data: instanceToPlain(value.data, serializeOptions),
          };
        }

        const plainValue = instanceToPlain(value, serializeOptions);

        return {
          data: plainValue,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
