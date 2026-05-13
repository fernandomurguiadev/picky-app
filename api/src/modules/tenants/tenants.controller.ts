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
import { TenantsService } from './tenants.service.js';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto.js';
import { ToggleStoreStatusDto } from './dto/toggle-store-status.dto.js';

@Controller('stores')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ─── Admin routes (rutas fijas primero para evitar colisión con :slug) ──

  @Get('me/settings')
  @UseGuards(JwtAuthGuard)
  getMySettings(@TenantId() tenantId: string) {
    return this.tenantsService.getMySettings(tenantId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  updateMySettings(
    @TenantId() tenantId: string,
    @Body() dto: UpdateStoreSettingsDto,
  ) {
    return this.tenantsService.updateMySettings(tenantId, dto);
  }

  @Patch('me/status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  toggleStatus(
    @TenantId() tenantId: string,
    @Body() dto: ToggleStoreStatusDto,
  ) {
    return this.tenantsService.toggleStoreStatus(tenantId, dto.isManualOpen);
  }

  // ─── Rutas públicas ──────────────────────────────────────────────────────

  @Get(':slug/tenant-id')
  getTenantId(@Param('slug') slug: string) {
    return this.tenantsService.getTenantId(slug);
  }

  @Get(':slug/status')
  getStoreStatus(@Param('slug') slug: string) {
    return this.tenantsService.getStoreStatus(slug);
  }

  @Get(':slug')
  getPublicStore(@Param('slug') slug: string) {
    return this.tenantsService.getPublicStore(slug);
  }
}
