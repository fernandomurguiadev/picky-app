import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import {
  PLAN_LIMIT_KEY,
  PlanLimitResource,
} from '../decorators/plan-limit.decorator.js';

const RESOURCE_TO_PLAN_FIELD: Record<PlanLimitResource, string> = {
  [PlanLimitResource.PRODUCT]: 'maxProducts',
  [PlanLimitResource.CATEGORY]: 'maxCategories',
  [PlanLimitResource.IMAGE]: 'maxImages',
  [PlanLimitResource.STAFF]: 'maxStaffUsers',
};

@Injectable()
export class PlanLimitsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.get<PlanLimitResource>(
      PLAN_LIMIT_KEY,
      context.getHandler(),
    );
    if (!resource) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { tenantId?: string } }>();
    const tenantId = request.user?.tenantId;
    if (!tenantId) return true;

    const row = await this.dataSource.query<
      { planGraceUntil: Date | null; planField: number | null }[]
    >(
      `SELECT t."planGraceUntil", p."${RESOURCE_TO_PLAN_FIELD[resource]}" AS "planField"
       FROM tenants t
       LEFT JOIN plans p ON p.id = t."planId"
       WHERE t.id = $1`,
      [tenantId],
    );

    if (!row.length || row[0]!.planField === null || row[0]!.planField === undefined) return true;

    const planGraceUntil = row[0]!.planGraceUntil;
    const planField = row[0]!.planField as number;

    if (planField === -1) return true;
    if (planGraceUntil && new Date(planGraceUntil) > new Date()) return true;

    const current = await this.countResource(resource, tenantId);
    if (current >= planField) {
      throw new ForbiddenException(`PLAN_LIMIT_EXCEEDED:${resource}`);
    }

    return true;
  }

  private async countResource(
    resource: PlanLimitResource,
    tenantId: string,
  ): Promise<number> {
    switch (resource) {
      case PlanLimitResource.PRODUCT: {
        const [{ count }] = await this.dataSource.query<[{ count: string }]>(
          `SELECT COUNT(*) AS count FROM products WHERE "tenantId" = $1`,
          [tenantId],
        );
        return parseInt(count, 10);
      }
      case PlanLimitResource.CATEGORY: {
        const [{ count }] = await this.dataSource.query<[{ count: string }]>(
          `SELECT COUNT(*) AS count FROM categories WHERE "tenantId" = $1`,
          [tenantId],
        );
        return parseInt(count, 10);
      }
      case PlanLimitResource.IMAGE: {
        const [{ count }] = await this.dataSource.query<[{ count: string }]>(
          `SELECT COUNT(*) AS count FROM products WHERE "tenantId" = $1 AND "imagePublicId" IS NOT NULL`,
          [tenantId],
        );
        return parseInt(count, 10);
      }
      case PlanLimitResource.STAFF: {
        const [{ count }] = await this.dataSource.query<[{ count: string }]>(
          `SELECT COUNT(*) AS count FROM tenant_memberships WHERE "tenantId" = $1 AND role = 'STAFF' AND "isActive" = true`,
          [tenantId],
        );
        return parseInt(count, 10);
      }
    }
  }
}
