import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

interface RequestWithTenant extends Request {
  tenantId?: string;
}

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.tenantId;
  },
);
