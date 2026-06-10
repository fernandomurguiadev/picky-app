import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedPlatformAdmin } from '../strategies/platform-jwt.strategy.js';

export const CurrentPlatformAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedPlatformAdmin => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as AuthenticatedPlatformAdmin;
  },
);
