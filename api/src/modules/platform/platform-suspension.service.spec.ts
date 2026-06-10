import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlatformSuspensionService } from './platform-suspension.service.js';
import { Tenant, TenantStatus } from '../tenants/entities/tenant.entity.js';
import { PlatformAuditLog, AuditAction } from './entities/platform-audit-log.entity.js';
import { REDIS_CLIENT } from '../../common/redis/redis.provider.js';

// ─── Factories ────────────────────────────────────────────────────────────────

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-001',
    name: 'Tienda Test',
    slug: 'tienda-test',
    status: TenantStatus.ACTIVE,
    isActive: true,
    isOnboardingCompleted: true,
    suspensionReason: null,
    suspendedAt: null,
    planId: null,
    plan: null,
    planGraceUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
    storeSettings: null,
    ...overrides,
  } as Tenant;
}

const ACTOR_ID = 'admin-001';
const IP = '127.0.0.1';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockTenantRepo = {
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockAuditRepo = {
  save: jest.fn(),
  create: jest.fn((data) => data),
};

const mockRedis = {
  set: jest.fn(),
  del: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PlatformSuspensionService', () => {
  let service: PlatformSuspensionService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        PlatformSuspensionService,
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
        { provide: getRepositoryToken(PlatformAuditLog), useValue: mockAuditRepo },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get(PlatformSuspensionService);
  });

  describe('suspend()', () => {
    it('updates DB status, sets Redis key, and logs TENANT_SUSPENDED', async () => {
      const tenant = makeTenant();
      mockTenantRepo.findOne.mockResolvedValue(tenant);
      mockTenantRepo.update.mockResolvedValue({ affected: 1 });
      mockRedis.set.mockResolvedValue('OK');
      mockAuditRepo.save.mockResolvedValue({});

      await service.suspend(tenant.id, 'Violación de términos', ACTOR_ID, IP);

      expect(mockTenantRepo.update).toHaveBeenCalledWith(
        tenant.id,
        expect.objectContaining({ status: TenantStatus.SUSPENDED }),
      );
      expect(mockRedis.set).toHaveBeenCalledWith(`suspended:${tenant.id}`, '1');
      expect(mockAuditRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.TENANT_SUSPENDED }),
      );
    });

    it('stores suspensionReason and suspendedAt in DB', async () => {
      mockTenantRepo.findOne.mockResolvedValue(makeTenant());
      mockTenantRepo.update.mockResolvedValue({});
      mockRedis.set.mockResolvedValue('OK');
      mockAuditRepo.save.mockResolvedValue({});

      await service.suspend('tenant-001', 'Fraude', ACTOR_ID);

      const [, updatePayload] = mockTenantRepo.update.mock.calls[0]!;
      expect(updatePayload).toMatchObject({
        suspensionReason: 'Fraude',
        suspendedAt: expect.any(Date),
      });
    });

    it('throws NotFoundException when tenant does not exist', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);
      await expect(
        service.suspend('nonexistent', 'reason', ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('includes actorId and ipAddress in audit log', async () => {
      mockTenantRepo.findOne.mockResolvedValue(makeTenant());
      mockTenantRepo.update.mockResolvedValue({});
      mockRedis.set.mockResolvedValue('OK');
      mockAuditRepo.save.mockResolvedValue({});

      await service.suspend('tenant-001', 'test', ACTOR_ID, IP);

      expect(mockAuditRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ actorId: ACTOR_ID, ipAddress: IP }),
      );
    });
  });

  describe('reactivate()', () => {
    it('updates DB status to ACTIVE, deletes Redis key, and logs TENANT_REACTIVATED', async () => {
      const tenant = makeTenant({ status: TenantStatus.SUSPENDED });
      mockTenantRepo.findOne.mockResolvedValue(tenant);
      mockTenantRepo.update.mockResolvedValue({});
      mockRedis.del.mockResolvedValue(1);
      mockAuditRepo.save.mockResolvedValue({});

      await service.reactivate(tenant.id, ACTOR_ID, IP);

      expect(mockTenantRepo.update).toHaveBeenCalledWith(
        tenant.id,
        expect.objectContaining({
          status: TenantStatus.ACTIVE,
          suspensionReason: null,
          suspendedAt: null,
        }),
      );
      expect(mockRedis.del).toHaveBeenCalledWith(`suspended:${tenant.id}`);
      expect(mockAuditRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.TENANT_REACTIVATED }),
      );
    });

    it('throws NotFoundException when tenant does not exist', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);
      await expect(
        service.reactivate('nonexistent', ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('does NOT call Redis del when tenant not found (no side effects)', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);
      await service.reactivate('bad-id', ACTOR_ID).catch(() => {});
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });
});
