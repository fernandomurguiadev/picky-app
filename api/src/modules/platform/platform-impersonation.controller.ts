import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PlatformImpersonationService } from './platform-impersonation.service.js';
import { PlatformAdminGuard } from './guards/platform-admin.guard.js';
import { CurrentPlatformAdmin } from './decorators/current-platform-admin.decorator.js';
import type { AuthenticatedPlatformAdmin } from './strategies/platform-jwt.strategy.js';
import { SkipRls } from '../../common/decorators/skip-rls.decorator.js';

@SkipRls()
@UseGuards(PlatformAdminGuard)
@Controller('platform/impersonate')
export class PlatformImpersonationController {
  constructor(private readonly service: PlatformImpersonationService) {}

  @Post(':tenantId')
  @HttpCode(HttpStatus.OK)
  generateCode(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    return this.service.generateCode(tenantId, admin.platformAdminId, ip);
  }
}
