import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PlatformAdminGuard } from './guards/platform-admin.guard.js';
import { CurrentPlatformAdmin } from './decorators/current-platform-admin.decorator.js';
import type { AuthenticatedPlatformAdmin } from './strategies/platform-jwt.strategy.js';
import { SkipRls } from '../../common/decorators/skip-rls.decorator.js';
import { PlatformTenantsService } from './platform-tenants.service.js';
import { PlatformTenantsQueryDto } from './dto/platform-tenants-query.dto.js';
import { PlatformCreateTenantDto } from './dto/platform-create-tenant.dto.js';
import { PlatformSuspendDto } from './dto/platform-suspend.dto.js';
import { PlatformChangePlanDto } from './dto/platform-change-plan.dto.js';

@SkipRls()
@UseGuards(PlatformAdminGuard)
@Controller('platform/tenants')
export class PlatformTenantsController {
  constructor(private readonly tenantsService: PlatformTenantsService) {}

  @Get()
  findAll(@Query() query: PlatformTenantsQueryDto) {
    return this.tenantsService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: PlatformCreateTenantDto,
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    return this.tenantsService.createTenant(dto, admin.platformAdminId, ip);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PlatformSuspendDto,
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    return this.tenantsService.suspend(id, dto.reason, admin.platformAdminId, ip);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    return this.tenantsService.reactivate(id, admin.platformAdminId, ip);
  }

  @Patch(':id/plan')
  changePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PlatformChangePlanDto,
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    return this.tenantsService.changePlan(id, dto, admin.platformAdminId, ip);
  }
}
