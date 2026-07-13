import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { FeatureService } from '../../modules/platform/feature.service.js';

export const FEATURE_KEY = 'requiredFeature';

interface RequestWithUser extends Request {
  user?: { tenantId: string };
}

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureService: FeatureService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true;
    }

    // Los Guards corren antes que los Interceptors en NestJS — TenantContextInterceptor
    // todavía no seteó request.tenantId en este punto. Se lee directo del JWT (request.user),
    // poblado por JwtAuthGuard, que corre antes en la misma cadena de @UseGuards(...).
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const tenantId = request.user?.tenantId;
    if (!tenantId) {
      return false;
    }

    return this.featureService.hasFeature(tenantId, requiredFeature);
  }
}
