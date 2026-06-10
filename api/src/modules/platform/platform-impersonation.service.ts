import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ImpersonationCode } from './entities/impersonation-code.entity.js';
import { PlatformAuditLog, AuditAction } from './entities/platform-audit-log.entity.js';
import { Tenant } from '../tenants/entities/tenant.entity.js';

@Injectable()
export class PlatformImpersonationService {
  constructor(
    @InjectRepository(ImpersonationCode)
    private readonly codeRepo: Repository<ImpersonationCode>,
    @InjectRepository(PlatformAuditLog)
    private readonly auditRepo: Repository<PlatformAuditLog>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async generateCode(
    tenantId: string,
    platformAdminId: string,
    ip?: string,
  ): Promise<{ code: string }> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado.');

    const code = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await this.codeRepo.save(
      this.codeRepo.create({ code, platformAdminId, tenantId, used: false, expiresAt }),
    );

    await this.auditRepo.save(
      this.auditRepo.create({
        actorId: platformAdminId,
        action: AuditAction.IMPERSONATION_STARTED,
        onBehalfOfTenantId: tenantId,
        ipAddress: ip ?? null,
        details: { tenantName: tenant.name, tenantSlug: tenant.slug },
      }),
    );

    return { code };
  }
}
