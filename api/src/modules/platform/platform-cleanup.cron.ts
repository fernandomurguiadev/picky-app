import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { PlatformAuditLog } from './entities/platform-audit-log.entity.js';
import { ImpersonationCode } from './entities/impersonation-code.entity.js';

const AUDIT_RETENTION_DAYS = 180;

@Injectable()
export class PlatformCleanupCron {
  private readonly logger = new Logger(PlatformCleanupCron.name);

  constructor(
    @InjectRepository(PlatformAuditLog)
    private readonly auditRepo: Repository<PlatformAuditLog>,
    @InjectRepository(ImpersonationCode)
    private readonly codeRepo: Repository<ImpersonationCode>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanOldAuditLogs() {
    const cutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await this.auditRepo.delete({ createdAt: LessThan(cutoff) });
    this.logger.log(`Audit log cleanup: ${result.affected ?? 0} registros eliminados (>${AUDIT_RETENTION_DAYS} días)`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanExpiredImpersonationCodes() {
    const result = await this.codeRepo.delete({ expiresAt: LessThan(new Date()), used: false });
    this.logger.log(`Impersonation codes cleanup: ${result.affected ?? 0} códigos expirados eliminados`);
  }
}
