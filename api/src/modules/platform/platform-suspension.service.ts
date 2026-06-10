import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/redis/redis.provider.js';
import { Tenant, TenantStatus } from '../tenants/entities/tenant.entity.js';
import { PlatformAuditLog, AuditAction } from './entities/platform-audit-log.entity.js';

@Injectable()
export class PlatformSuspensionService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(PlatformAuditLog)
    private readonly auditRepo: Repository<PlatformAuditLog>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async suspend(
    tenantId: string,
    reason: string,
    actorId: string,
    ip?: string,
  ): Promise<void> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado.');

    await this.tenantRepo.update(tenantId, {
      status: TenantStatus.SUSPENDED,
      suspensionReason: reason,
      suspendedAt: new Date(),
    });

    await this.redis.set(`suspended:${tenantId}`, '1');

    await this.auditRepo.save(
      this.auditRepo.create({
        actorId,
        action: AuditAction.TENANT_SUSPENDED,
        onBehalfOfTenantId: tenantId,
        ipAddress: ip ?? null,
        details: { reason, tenantName: tenant.name },
      }),
    );
  }

  async reactivate(
    tenantId: string,
    actorId: string,
    ip?: string,
  ): Promise<void> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado.');

    await this.tenantRepo.update(tenantId, {
      status: TenantStatus.ACTIVE,
      suspensionReason: null,
      suspendedAt: null,
    });

    await this.redis.del(`suspended:${tenantId}`);

    await this.auditRepo.save(
      this.auditRepo.create({
        actorId,
        action: AuditAction.TENANT_REACTIVATED,
        onBehalfOfTenantId: tenantId,
        ipAddress: ip ?? null,
        details: { tenantName: tenant.name },
      }),
    );
  }
}
