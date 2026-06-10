import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant, TenantStatus } from '../tenants/entities/tenant.entity.js';
import { Plan } from './entities/plan.entity.js';
import { PlatformAuditLog, AuditAction } from './entities/platform-audit-log.entity.js';
import { User, UserRole } from '../auth/entities/user.entity.js';
import { TenantMembership } from '../auth/entities/tenant-membership.entity.js';
import { StoreSettings } from '../tenants/entities/store-settings.entity.js';
import { PlatformSuspensionService } from './platform-suspension.service.js';
import type { PlatformTenantsQueryDto } from './dto/platform-tenants-query.dto.js';
import type { PlatformCreateTenantDto } from './dto/platform-create-tenant.dto.js';
import type { PlatformChangePlanDto } from './dto/platform-change-plan.dto.js';

const BCRYPT_ROUNDS = 12;
const GRACE_PERIOD_DAYS = 30;
const PLAN_LIMIT_ORDER: Record<string, number> = {};

function planScore(plan: Plan): number {
  // -1 means unlimited → biggest score
  const v = (n: number) => (n === -1 ? Infinity : n);
  return v(plan.maxProducts) + v(plan.maxCategories) + v(plan.maxStaffUsers) + v(plan.maxImages);
}

@Injectable()
export class PlatformTenantsService {
  constructor(
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @InjectRepository(PlatformAuditLog) private readonly auditRepo: Repository<PlatformAuditLog>,
    private readonly suspensionService: PlatformSuspensionService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: PlatformTenantsQueryDto) {
    const { search, status, planId, page, limit, orderBy, order } = query;
    const qb = this.tenantRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.plan', 'plan')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(`t.${orderBy}`, order.toUpperCase() as 'ASC' | 'DESC');

    if (search) {
      qb.andWhere('(t.name ILIKE :search OR t.slug ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    if (status) {
      qb.andWhere('t.status = :status', { status });
    }
    if (planId) {
      qb.andWhere('t.planId = :planId', { planId });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createTenant(
    dto: PlatformCreateTenantDto,
    actorId: string,
    ip: string,
  ): Promise<Tenant> {
    const freePlan = await this.planRepo.findOne({ where: { name: 'Free' } });
    if (!freePlan) throw new BadRequestException('Plan Free no encontrado. Ejecutar seed de planes.');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tenant = queryRunner.manager.create(Tenant, {
        name: dto.name,
        slug: dto.slug.toLowerCase(),
        isActive: true,
        status: TenantStatus.ACTIVE,
        planId: freePlan.id,
      });
      await queryRunner.manager.save(tenant);

      await queryRunner.query(
        `SELECT set_config('app.current_tenant_id', $1, true)`,
        [tenant.id],
      );

      const passwordHash = await bcrypt.hash(dto.ownerPassword, BCRYPT_ROUNDS);
      const user = queryRunner.manager.create(User, {
        email: dto.ownerEmail.toLowerCase(),
        passwordHash,
        role: UserRole.ADMIN,
      });
      await queryRunner.manager.save(user);

      const membership = queryRunner.manager.create(TenantMembership, {
        userId: user.id,
        tenantId: tenant.id,
        role: UserRole.ADMIN,
        isActive: true,
      });
      await queryRunner.manager.save(membership);

      const settings = queryRunner.manager.create(StoreSettings, {
        tenantId: tenant.id,
      });
      await queryRunner.manager.save(settings);

      await queryRunner.commitTransaction();

      await this.auditRepo.save(
        this.auditRepo.create({
          actorId,
          action: AuditAction.TENANT_CREATED,
          onBehalfOfTenantId: tenant.id,
          ipAddress: ip,
          details: { slug: tenant.slug, planId: freePlan?.id ?? null },
        }),
      );

      return tenant;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if ((error as any)?.code === '23505') {
        const detail: string = (error as any)?.detail ?? '';
        if (detail.includes('email')) throw new ConflictException('El email ya está registrado');
        if (detail.includes('slug')) throw new ConflictException('El slug no está disponible');
        throw new ConflictException('Ya existe una cuenta con esos datos');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async suspend(tenantId: string, reason: string | undefined, actorId: string, ip: string) {
    await this.assertTenantExists(tenantId);
    await this.suspensionService.suspend(tenantId, reason ?? '', actorId, ip);
    return { ok: true };
  }

  async reactivate(tenantId: string, actorId: string, ip: string) {
    await this.assertTenantExists(tenantId);
    await this.suspensionService.reactivate(tenantId, actorId, ip);
    return { ok: true };
  }

  async changePlan(tenantId: string, dto: PlatformChangePlanDto, actorId: string, ip: string) {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      relations: ['plan'],
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const newPlan = await this.planRepo.findOne({ where: { id: dto.planId } });
    if (!newPlan) throw new NotFoundException('Plan no encontrado');
    if (newPlan.isHidden) throw new BadRequestException('No se puede asignar un plan oculto a un tenant');

    const previousPlanId = tenant.planId;
    const isDowngrade =
      tenant.plan !== null &&
      planScore(newPlan) < planScore(tenant.plan);

    await this.tenantRepo.update(tenantId, {
      planId: dto.planId,
      planGraceUntil: isDowngrade
        ? new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
        : null,
    });

    await this.auditRepo.save(
      this.auditRepo.create({
        actorId,
        action: AuditAction.TENANT_PLAN_CHANGED,
        onBehalfOfTenantId: tenantId,
        ipAddress: ip,
        details: { previousPlanId, newPlanId: dto.planId, isDowngrade },
      }),
    );

    return { ok: true, isDowngrade };
  }

  private async assertTenantExists(tenantId: string) {
    const exists = await this.tenantRepo.exists({ where: { id: tenantId } });
    if (!exists) throw new NotFoundException('Tenant no encontrado');
  }
}
