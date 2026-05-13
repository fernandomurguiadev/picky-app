import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';

interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
}

interface RequestWithTenant extends Request {
  user?: JwtPayload;
  tenantId?: string;
}

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    if (request.user?.tenantId) {
      request.tenantId = request.user.tenantId;
    }

    return next.handle();
  }
}
