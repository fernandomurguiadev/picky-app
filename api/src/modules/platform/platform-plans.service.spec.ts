import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlatformPlansService } from './platform-plans.service.js';
import { Plan } from './entities/plan.entity.js';
import { Tenant, TenantStatus } from '../tenants/entities/tenant.entity.js';

// ─── Factories ────────────────────────────────────────────────────────────────

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'plan-001',
    name: 'Pro',
    maxProducts: 40,
    maxCategories: 15,
    maxStaffUsers: 3,
    maxImages: 80,
    isHidden: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Plan;
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPlanRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  create: jest.fn((data) => ({ ...data })),
  save: jest.fn((entity) => Promise.resolve({ id: 'plan-new', ...entity })),
};

const mockTenantRepo = {
  count: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PlatformPlansService', () => {
  let service: PlatformPlansService;

  beforeEach(async () => {
    // resetAllMocks clears the mockResolvedValueOnce queue — prevents stale values between tests
    jest.resetAllMocks();
    mockPlanRepo.create.mockImplementation((data: Partial<Plan>) => ({ ...data }));
    mockPlanRepo.save.mockImplementation((entity: Plan) =>
      Promise.resolve({ ...entity, id: entity.id ?? 'plan-new' }),
    );

    const module = await Test.createTestingModule({
      providers: [
        PlatformPlansService,
        { provide: getRepositoryToken(Plan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
      ],
    }).compile();

    service = module.get(PlatformPlansService);
  });

  describe('findOne()', () => {
    it('returns plan when found', async () => {
      const plan = makePlan();
      mockPlanRepo.findOne.mockResolvedValue(plan);
      const result = await service.findOne('plan-001');
      expect(result).toEqual(plan);
    });

    it('throws NotFoundException when plan does not exist', async () => {
      mockPlanRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create()', () => {
    it('creates plan successfully', async () => {
      mockPlanRepo.findOne.mockResolvedValue(null); // no duplicate
      const dto = { name: 'Enterprise', maxProducts: 100, maxCategories: 30, maxStaffUsers: 10, maxImages: 200 };
      await service.create(dto);
      expect(mockPlanRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException when plan name already exists', async () => {
      mockPlanRepo.findOne.mockResolvedValue(makePlan({ name: 'Pro' }));
      await expect(
        service.create({ name: 'Pro', maxProducts: 40, maxCategories: 15, maxStaffUsers: 3, maxImages: 80 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update()', () => {
    it('updates plan successfully', async () => {
      const plan = makePlan();
      mockPlanRepo.findOne.mockResolvedValueOnce(plan).mockResolvedValueOnce(null);
      await service.update('plan-001', { maxProducts: 50 });
      expect(mockPlanRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ maxProducts: 50 }),
      );
    });

    it('throws ConflictException when renaming to an existing plan name', async () => {
      const plan = makePlan({ name: 'Pro' });
      const other = makePlan({ id: 'plan-002', name: 'Starter' });
      mockPlanRepo.findOne
        .mockResolvedValueOnce(plan)    // findOne for the plan being updated
        .mockResolvedValueOnce(other);  // findOne checking for name conflict
      await expect(
        service.update('plan-001', { name: 'Starter' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('toggleVisibility()', () => {
    it('hides a visible plan with no active tenants', async () => {
      const plan = makePlan({ isHidden: false });
      mockPlanRepo.findOne.mockResolvedValue(plan);
      mockTenantRepo.count.mockResolvedValue(0); // no active tenants
      mockPlanRepo.save.mockResolvedValue({ ...plan, isHidden: true });

      const result = await service.toggleVisibility('plan-001');

      expect(mockTenantRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ planId: 'plan-001' }),
          ]),
        }),
      );
      expect(mockPlanRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isHidden: true }),
      );
    });

    it('throws BadRequestException when hiding a plan with active tenants', async () => {
      const plan = makePlan({ isHidden: false });
      mockPlanRepo.findOne.mockResolvedValue(plan);
      mockTenantRepo.count.mockResolvedValue(3); // 3 active tenants

      await expect(service.toggleVisibility('plan-001')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPlanRepo.save).not.toHaveBeenCalled();
    });

    it('unhides a hidden plan without checking tenant count', async () => {
      const plan = makePlan({ isHidden: true });
      mockPlanRepo.findOne.mockResolvedValue(plan);
      mockPlanRepo.save.mockResolvedValue({ ...plan, isHidden: false });

      await service.toggleVisibility('plan-001');

      expect(mockTenantRepo.count).not.toHaveBeenCalled();
      expect(mockPlanRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isHidden: false }),
      );
    });
  });
});
