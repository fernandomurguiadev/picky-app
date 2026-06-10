import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformAdminGuard } from './guards/platform-admin.guard.js';
import { SkipRls } from '../../common/decorators/skip-rls.decorator.js';
import { PlatformAuditLog } from './entities/platform-audit-log.entity.js';
import { PlatformAuditLogsQueryDto } from './dto/platform-audit-logs-query.dto.js';

@SkipRls()
@UseGuards(PlatformAdminGuard)
@Controller('platform/audit-logs')
export class PlatformAuditLogsController {
  constructor(
    @InjectRepository(PlatformAuditLog)
    private readonly auditRepo: Repository<PlatformAuditLog>,
  ) {}

  @Get()
  async findAll(@Query() query: PlatformAuditLogsQueryDto) {
    const { action, tenantId, actorId, dateFrom, dateTo, page, limit } = query;

    if (dateFrom && dateTo) {
      const rangeMs = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
      const maxMs = 90 * 24 * 60 * 60 * 1000;
      if (rangeMs > maxMs) throw new BadRequestException('El rango de fechas no puede superar los 90 días.');
    }

    const qb = this.auditRepo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (action) qb.andWhere('log.action = :action', { action });
    if (tenantId) qb.andWhere('log.onBehalfOfTenantId = :tenantId', { tenantId });
    if (actorId) qb.andWhere('log.actorId = :actorId', { actorId });
    if (dateFrom) qb.andWhere('log.createdAt >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('log.createdAt <= :dateTo', { dateTo });

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
