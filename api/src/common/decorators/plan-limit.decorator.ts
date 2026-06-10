import { SetMetadata } from '@nestjs/common';

export enum PlanLimitResource {
  PRODUCT = 'product',
  CATEGORY = 'category',
  IMAGE = 'image',
  STAFF = 'staff',
}

export const PLAN_LIMIT_KEY = 'plan_limit_resource';
export const PlanLimit = (resource: PlanLimitResource) =>
  SetMetadata(PLAN_LIMIT_KEY, resource);
