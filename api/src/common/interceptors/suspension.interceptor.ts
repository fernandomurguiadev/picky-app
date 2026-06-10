import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import type { Request } from 'express';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.provider.js';
import { SKIP_RLS_KEY } from '../decorators/skip-rls.decorator.js';

interface RequestWithTenant extends Request {
  user?: { tenantId?: string };
}

@Injectable()
export class SuspensionInterceptor implements NestInterceptor {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const isSkipRls = this.reflector.getAllAndOverride<boolean>(SKIP_RLS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isSkipRls) return next.handle();

    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenantId = request.user?.tenantId;

    if (!tenantId) return next.handle();

    const suspended = await this.redis.exists(`suspended:${tenantId}`);
    if (suspended) {
      throw new ForbiddenException('TENANT_SUSPENDED');
    }

    return next.handle();
  }
}
