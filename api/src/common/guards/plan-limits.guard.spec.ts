import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PlanLimitsGuard } from './plan-limits.guard.js';
import { PLAN_LIMIT_KEY, PlanLimitResource } from '../decorators/plan-limit.decorator.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContext(
  resource: PlanLimitResource | undefined,
  tenantId: string | undefined,
): ExecutionContext {
  const handler = {};
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: tenantId ? { tenantId } : undefined }),
    }),
    getHandler: () => handler,
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

const TENANT_ID = 'tenant-uuid-001';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockReflector = { get: jest.fn() };
const mockDataSource = { query: jest.fn() };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PlanLimitsGuard', () => {
  let guard: PlanLimitsGuard;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        PlanLimitsGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    guard = module.get(PlanLimitsGuard);
  });

  describe('early-return cases (no DB query needed)', () => {
    it('passes when route has no @PlanLimit decorator', async () => {
      mockReflector.get.mockReturnValue(undefined);
      const ctx = makeContext(undefined, TENANT_ID);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('passes when user has no tenantId (unauthenticated)', async () => {
      mockReflector.get.mockReturnValue(PlanLimitResource.PRODUCT);
      const ctx = makeContext(PlanLimitResource.PRODUCT, undefined);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });
  });

  describe('plan evaluation', () => {
    function setupPlan(planField: number | null, planGraceUntil: Date | null = null) {
      mockReflector.get.mockReturnValue(PlanLimitResource.PRODUCT);
      mockDataSource.query
        .mockResolvedValueOnce([{ planField, planGraceUntil }]) // plan query
        .mockResolvedValueOnce([{ count: '5' }]); // count query
    }

    it('passes when tenant has no plan assigned (planField null)', async () => {
      mockReflector.get.mockReturnValue(PlanLimitResource.PRODUCT);
      mockDataSource.query.mockResolvedValueOnce([{ planField: null, planGraceUntil: null }]);
      const ctx = makeContext(PlanLimitResource.PRODUCT, TENANT_ID);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('passes when planField is -1 (unlimited — Business plan)', async () => {
      mockReflector.get.mockReturnValue(PlanLimitResource.PRODUCT);
      mockDataSource.query.mockResolvedValueOnce([{ planField: -1, planGraceUntil: null }]);
      const ctx = makeContext(PlanLimitResource.PRODUCT, TENANT_ID);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(mockDataSource.query).toHaveBeenCalledTimes(1); // no count query needed
    });

    it('passes when grace period is still active (downgrade scenario)', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead
      mockReflector.get.mockReturnValue(PlanLimitResource.PRODUCT);
      mockDataSource.query.mockResolvedValueOnce([{ planField: 10, planGraceUntil: futureDate }]);
      const ctx = makeContext(PlanLimitResource.PRODUCT, TENANT_ID);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(mockDataSource.query).toHaveBeenCalledTimes(1); // no count query
    });

    it('passes when count < limit', async () => {
      mockReflector.get.mockReturnValue(PlanLimitResource.PRODUCT);
      mockDataSource.query
        .mockResolvedValueOnce([{ planField: 10, planGraceUntil: null }])
        .mockResolvedValueOnce([{ count: '9' }]);
      const ctx = makeContext(PlanLimitResource.PRODUCT, TENANT_ID);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('blocks when count === limit', async () => {
      mockReflector.get.mockReturnValue(PlanLimitResource.PRODUCT);
      mockDataSource.query
        .mockResolvedValueOnce([{ planField: 10, planGraceUntil: null }])
        .mockResolvedValueOnce([{ count: '10' }]);
      const ctx = makeContext(PlanLimitResource.PRODUCT, TENANT_ID);
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        new ForbiddenException('PLAN_LIMIT_EXCEEDED:product'),
      );
    });

    it('blocks when count > limit (data already exceeded)', async () => {
      mockReflector.get.mockReturnValue(PlanLimitResource.CATEGORY);
      mockDataSource.query
        .mockResolvedValueOnce([{ planField: 3, planGraceUntil: null }])
        .mockResolvedValueOnce([{ count: '5' }]);
      const ctx = makeContext(PlanLimitResource.CATEGORY, TENANT_ID);
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('expired grace period enforces new limits', async () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      mockReflector.get.mockReturnValue(PlanLimitResource.PRODUCT);
      mockDataSource.query
        .mockResolvedValueOnce([{ planField: 10, planGraceUntil: pastDate }])
        .mockResolvedValueOnce([{ count: '15' }]); // over new limit
      const ctx = makeContext(PlanLimitResource.PRODUCT, TENANT_ID);
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('resource-specific SQL queries', () => {
    async function runForResource(resource: PlanLimitResource, count = '5', limit = 10) {
      mockReflector.get.mockReturnValue(resource);
      mockDataSource.query
        .mockResolvedValueOnce([{ planField: limit, planGraceUntil: null }])
        .mockResolvedValueOnce([{ count }]);
      const ctx = makeContext(resource, TENANT_ID);
      await guard.canActivate(ctx);
      return mockDataSource.query.mock.calls[1]![0] as string;
    }

    it('queries products table for PRODUCT resource', async () => {
      const sql = await runForResource(PlanLimitResource.PRODUCT);
      expect(sql).toContain('FROM products');
    });

    it('queries categories table for CATEGORY resource', async () => {
      const sql = await runForResource(PlanLimitResource.CATEGORY);
      expect(sql).toContain('FROM categories');
    });

    it('filters imagePublicId IS NOT NULL for IMAGE resource', async () => {
      const sql = await runForResource(PlanLimitResource.IMAGE);
      expect(sql).toContain('FROM products');
      expect(sql).toContain('"imagePublicId" IS NOT NULL');
    });

    it('queries tenant_memberships with role=STAFF for STAFF resource', async () => {
      const sql = await runForResource(PlanLimitResource.STAFF);
      expect(sql).toContain('FROM tenant_memberships');
      expect(sql).toContain("role = 'STAFF'");
    });
  });
});
