import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantId } from '../../common/decorators/tenant-id.decorator.js';
import { DashboardService } from './dashboard.service.js';
import type { DashboardMetricsDto } from './dto/dashboard-metrics.dto.js';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getMetrics(
    @TenantId() tenantId: string,
  ): Promise<{ data: DashboardMetricsDto }> {
    const data = await this.dashboardService.getMetrics(tenantId);
    return { data };
  }
}
