import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';
import {
  PlatformAuditLog,
  AuditAction,
} from '../../modules/platform/entities/platform-audit-log.entity.js';

interface ImpersonatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    isImpersonated?: boolean;
    actorId?: string;
  };
}

const METHOD_ACTION_MAP: Record<string, Record<string, AuditAction>> = {
  products: {
    POST: AuditAction.IMPERSONATION_PRODUCT_CREATED,
    PATCH: AuditAction.IMPERSONATION_PRODUCT_UPDATED,
    DELETE: AuditAction.IMPERSONATION_PRODUCT_DELETED,
  },
  categories: {
    POST: AuditAction.IMPERSONATION_CATEGORY_CREATED,
    PATCH: AuditAction.IMPERSONATION_CATEGORY_UPDATED,
    DELETE: AuditAction.IMPERSONATION_CATEGORY_DELETED,
  },
};

function resolveAction(path: string, method: string): AuditAction | null {
  for (const [resource, methodMap] of Object.entries(METHOD_ACTION_MAP)) {
    if (path.includes(resource) && methodMap[method]) {
      return methodMap[method] ?? null;
    }
  }
  return null;
}

@Injectable()
export class ImpersonationAuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(PlatformAuditLog)
    private readonly auditRepo: Repository<PlatformAuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<ImpersonatedRequest>();
    const user = request.user;

    if (!user?.isImpersonated || !user.actorId) return next.handle();

    const action = resolveAction(request.path, request.method);
    if (!action) return next.handle();

    return next.handle().pipe(
      tap(() => {
        void this.auditRepo.save(
          this.auditRepo.create({
            actorId: user.actorId!,
            action,
            onBehalfOfTenantId: user.tenantId,
            ipAddress: request.ip ?? null,
            details: { path: request.path, method: request.method },
          }),
        );
      }),
    );
  }
}
