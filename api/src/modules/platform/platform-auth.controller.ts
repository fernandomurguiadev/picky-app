import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { PlatformAuthService } from './platform-auth.service.js';
import { PlatformLoginDto } from './dto/platform-login.dto.js';
import { PlatformMfaVerifyDto, PlatformMfaConfirmDto } from './dto/platform-mfa.dto.js';
import { PlatformAdminGuard } from './guards/platform-admin.guard.js';
import { CurrentPlatformAdmin } from './decorators/current-platform-admin.decorator.js';
import type { AuthenticatedPlatformAdmin } from './strategies/platform-jwt.strategy.js';
import { SkipRls } from '../../common/decorators/skip-rls.decorator.js';

@SkipRls()
@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly service: PlatformAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900000, limit: 5 } }) // 5 intentos / 15 min por IP
  login(
    @Body() dto: PlatformLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = (req.ip ?? req.socket.remoteAddress ?? 'unknown');
    const ua = req.headers['user-agent'] ?? 'unknown';
    return this.service.login(dto, ip, ua, res);
  }

  @Post('login/mfa')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 300000, limit: 10 } }) // 10 intentos / 5 min (ventana del MFA pending)
  verifyMfa(
    @Body() dto: PlatformMfaVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const mfaPendingToken = req.cookies?.['platform-mfa-pending'] as string | undefined;
    if (!mfaPendingToken) throw new UnauthorizedException('Token MFA requerido.');
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const ua = req.headers['user-agent'] ?? 'unknown';
    return this.service.verifyMfa(mfaPendingToken, dto, ip, ua, res);
  }

  @Post('mfa/setup')
  @UseGuards(PlatformAdminGuard)
  @HttpCode(HttpStatus.OK)
  setupMfa(@CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin) {
    return this.service.setupMfa(admin.platformAdminId);
  }

  @Post('mfa/verify')
  @UseGuards(PlatformAdminGuard)
  @HttpCode(HttpStatus.OK)
  confirmMfa(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Body() dto: PlatformMfaConfirmDto,
  ) {
    return this.service.confirmMfa(admin.platformAdminId, dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['platform-refresh-token'] as string | undefined;
    if (!token) throw new UnauthorizedException('Sin refresh token.');
    return this.service.refresh(token, res);
  }

  @Post('logout')
  @UseGuards(PlatformAdminGuard)
  @HttpCode(HttpStatus.OK)
  logout(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    return this.service.logout(admin.platformAdminId, ip, res);
  }
}
