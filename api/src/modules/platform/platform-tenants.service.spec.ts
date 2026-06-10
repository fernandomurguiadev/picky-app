import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PlatformTenantsService } from './platform-tenants.service.js';
import { Tenant, TenantStatus } from '../tenants/entities/tenant.entity.js';
import { Plan } from './entities/plan.entity.js';
import { PlatformAuditLog, AuditAction } from './entities/platform-audit-log.entity.js';
import { PlatformSuspensionService } from './platform-suspension.service.js';

// ─── Factories ────────────────────────────────────────────────────────────────

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'plan-free',
    name: 'Free',
    maxProducts: 10,
    maxCategories: 3,
    maxStaffUsers: 1,
    maxImages: 10,
    isHidden: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Plan;
}

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-001',
    name: 'Tienda Test',
    slug: 'tienda-test',
    status: TenantStatus.ACTIVE,
    isActive: true,
    isOnboardingCompleted: false,
    suspensionReason: null,
    suspendedAt: null,
    planId: 'plan-free',
    plan: makePlan(),
    planGraceUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
    storeSettings: null,
    ...overrides,
  } as Tenant;
}

const ACTOR_ID = 'admin-001';
const IP = '1.2.3.4';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    create: jest.fn((Entity, data) => ({ ...data })),
    save: jest.fn((entity) => Promise.resolve({ id: 'new-id', ...entity })),
    query: jest.fn(),
  },
  query: jest.fn(),
};

const mockDataSource = {
  createQueryRunner: jest.fn(() => mockQueryRunner),
};

const mockTenantRepo = {
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  exists: jest.fn(),
};

const mockPlanRepo = {
  findOne: jest.fn(),
};

const mockAuditRepo = {
  save: jest.fn(),
  create: jest.fn((data) => data),
};

const mockSuspensionService = {
  suspend: jest.fn(),
  reactivate: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PlatformTenantsService', () => {
  let service: PlatformTenantsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        PlatformTenantsService,
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
        { provide: getRepositoryToken(Plan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(PlatformAuditLog), useValue: mockAuditRepo },
        { provide: PlatformSuspensionService, useValue: mockSuspensionService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get(PlatformTenantsService);
  });

  describe('changePlan()', () => {
    it('changes plan and clears planGraceUntil on upgrade (bigger plan)', async () => {
      const currentPlan = makePlan({ id: 'plan-free', maxProducts: 10 });
      const newPlan = makePlan({ id: 'plan-pro', name: 'Pro', maxProducts: 40 });
      const tenant = makeTenant({ planId: 'plan-free', plan: currentPlan });

      mockTenantRepo.findOne.mockResolvedValue(tenant);
      mockPlanRepo.findOne.mockResolvedValue(newPlan);
      mockTenantRepo.update.mockResolvedValue({});
      mockAuditRepo.save.mockResolvedValue({});

      const result = await service.changePlan(tenant.id, { planId: 'plan-pro' }, ACTOR_ID, IP);

      expect(result).toMatchObject({ ok: true, isDowngrade: false });
      expect(mockTenantRepo.update).toHaveBeenCalledWith(
        tenant.id,
        expect.objectContaining({ planId: 'plan-pro', planGraceUntil: null }),
      );
    });

    it('sets planGraceUntil ~30 days in the future on downgrade', async () => {
      const currentPlan = makePlan({ id: 'plan-pro', name: 'Pro', maxProducts: 40 });
      const newPlan = makePlan({ id: 'plan-free', name: 'Free', maxProducts: 10 });
      const tenant = makeTenant({ planId: 'plan-pro', plan: currentPlan });

      mockTenantRepo.findOne.mockResolvedValue(tenant);
      mockPlanRepo.findOne.mockResolvedValue(newPlan);
      mockTenantRepo.update.mockResolvedValue({});
      mockAuditRepo.save.mockResolvedValue({});

      const before = Date.now();
      const result = await service.changePlan(tenant.id, { planId: 'plan-free' }, ACTOR_ID, IP);
      const after = Date.now();

      expect(result).toMatchObject({ ok: true, isDowngrade: true });

      const [, updatePayload] = mockTenantRepo.update.mock.calls[0]!;
      const graceUntil = (updatePayload as { planGraceUntil: Date }).planGraceUntil;
      expect(graceUntil).toBeInstanceOf(Date);

      const expectedMs = 30 * 24 * 60 * 60 * 1000;
      expect(graceUntil.getTime()).toBeGreaterThanOrEqual(before + expectedMs - 1000);
      expect(graceUntil.getTime()).toBeLessThanOrEqual(after + expectedMs + 1000);
    });

    it('logs TENANT_PLAN_CHANGED with previousPlanId and newPlanId', async () => {
      const currentPlan = makePlan({ id: 'plan-free' });
      const newPlan = makePlan({ id: 'plan-pro', name: 'Pro', maxProducts: 40 });
      const tenant = makeTenant({ planId: 'plan-free', plan: currentPlan });

      mockTenantRepo.findOne.mockResolvedValue(tenant);
      mockPlanRepo.findOne.mockResolvedValue(newPlan);
      mockTenantRepo.update.mockResolvedValue({});
      mockAuditRepo.save.mockResolvedValue({});

      await service.changePlan(tenant.id, { planId: 'plan-pro' }, ACTOR_ID, IP);

      expect(mockAuditRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TENANT_PLAN_CHANGED,
          actorId: ACTOR_ID,
          onBehalfOfTenantId: tenant.id,
          details: expect.objectContaining({
            previousPlanId: 'plan-free',
            newPlanId: 'plan-pro',
          }),
        }),
      );
    });

    it('throws NotFoundException when tenant does not exist', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);
      await expect(
        service.changePlan('bad-id', { planId: 'plan-pro' }, ACTOR_ID, IP),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when new plan does not exist', async () => {
      const tenant = makeTenant();
      mockTenantRepo.findOne.mockResolvedValue(tenant);
      mockPlanRepo.findOne.mockResolvedValue(null);
      await expect(
        service.changePlan(tenant.id, { planId: 'nonexistent-plan' }, ACTOR_ID, IP),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('suspend() / reactivate() delegation', () => {
    it('calls suspensionService.suspend with correct args', async () => {
      mockTenantRepo.exists.mockResolvedValue(true);
      mockSuspensionService.suspend.mockResolvedValue(undefined);

      await service.suspend('tenant-001', 'test reason', ACTOR_ID, IP);

      expect(mockSuspensionService.suspend).toHaveBeenCalledWith(
        'tenant-001',
        'test reason',
        ACTOR_ID,
        IP,
      );
    });

    it('calls suspensionService.reactivate with correct args', async () => {
      mockTenantRepo.exists.mockResolvedValue(true);
      mockSuspensionService.reactivate.mockResolvedValue(undefined);

      await service.reactivate('tenant-001', ACTOR_ID, IP);

      expect(mockSuspensionService.reactivate).toHaveBeenCalledWith(
        'tenant-001',
        ACTOR_ID,
        IP,
      );
    });

    it('throws NotFoundException before delegating if tenant does not exist', async () => {
      mockTenantRepo.exists.mockResolvedValue(false);
      await expect(
        service.suspend('bad-id', 'reason', ACTOR_ID, IP),
      ).rejects.toThrow(NotFoundException);
      expect(mockSuspensionService.suspend).not.toHaveBeenCalled();
    });
  });
});
