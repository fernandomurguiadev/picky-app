import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

interface RequestWithTenant extends Request {
  tenantId?: string;
  params: Record<string, string>;
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenantId = request.tenantId;
    const paramTenantId = request.params['tenantId'];

    // Si el endpoint no tiene :tenantId como param, no aplica restricción
    if (!paramTenantId) {
      return true;
    }

    if (!tenantId || tenantId !== paramTenantId) {
      throw new ForbiddenException('Acceso denegado al recurso del tenant.');
    }

    return true;
  }
}
