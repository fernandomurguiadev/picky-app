import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantId } from '../../common/decorators/tenant-id.decorator.js';
import { SkipRls } from '../../common/decorators/skip-rls.decorator.js';
import { RlsRunner } from '../../common/decorators/rls-runner.decorator.js';
import type { QueryRunner } from 'typeorm';
import { TenantsService } from './tenants.service.js';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto.js';
import { ToggleStoreStatusDto } from './dto/toggle-store-status.dto.js';

@Controller('stores')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ─── Admin routes (rutas fijas primero para evitar colisión con :slug) ──

  @Get('me/settings')
  @UseGuards(JwtAuthGuard)
  getMySettings(
    @TenantId() tenantId: string,
    @RlsRunner() runner: QueryRunner,
  ) {
    return this.tenantsService.getMySettings(tenantId, runner);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  updateMySettings(
    @TenantId() tenantId: string,
    @Body() dto: UpdateStoreSettingsDto,
    @RlsRunner() runner: QueryRunner,
  ) {
    return this.tenantsService.updateMySettings(tenantId, dto, runner);
  }

  @Patch('me/status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  toggleStatus(
    @TenantId() tenantId: string,
    @Body() dto: ToggleStoreStatusDto,
    @RlsRunner() runner: QueryRunner,
  ) {
    return this.tenantsService.toggleStoreStatus(tenantId, dto.isManualOpen, runner);
  }

  // ─── Rutas públicas ──────────────────────────────────────────────────────

  @SkipRls()
  @Get(':slug/tenant-id')
  getTenantId(@Param('slug') slug: string) {
    return this.tenantsService.getTenantId(slug);
  }

  @SkipRls()
  @Get(':slug/status')
  getStoreStatus(@Param('slug') slug: string) {
    return this.tenantsService.getStoreStatus(slug);
  }

  @SkipRls()
  @Get(':slug')
  getPublicStore(@Param('slug') slug: string) {
    return this.tenantsService.getPublicStore(slug);
  }
}
