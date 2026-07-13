import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { FeatureGuard } from '../../common/guards/feature.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RequireFeature } from '../../common/decorators/require-feature.decorator.js';
import { TenantId } from '../../common/decorators/tenant-id.decorator.js';
import { FeatureCode } from '../platform/enums/feature-code.enum.js';
import { ReportsService } from './reports.service.js';
import { ProfitabilityQueryDto } from './dto/profitability-query.dto.js';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('profitability')
  @Roles('admin')
  @RequireFeature(FeatureCode.ANALYTICS)
  getProfitability(
    @TenantId() tenantId: string,
    @Query() query: ProfitabilityQueryDto,
  ) {
    return this.reportsService.getProfitability(tenantId, query);
  }
}
