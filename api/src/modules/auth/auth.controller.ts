import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { ImpersonateService } from './impersonate.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { SelectTenantDto } from './dto/select-tenant.dto.js';
import { SwitchTenantDto } from './dto/switch-tenant.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from './strategies/jwt.strategy.js';
import { SkipRls } from '../../common/decorators/skip-rls.decorator.js';

@SkipRls()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly impersonateService: ImpersonateService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(dto, res);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @Post('select-tenant')
  @HttpCode(HttpStatus.OK)
  selectTenant(
    @Body() dto: SelectTenantDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.selectTenant(dto.selectionToken, dto.tenantId, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['refresh-token'] as string | undefined;
    if (!token) {
      throw new UnauthorizedException('Sin refresh token.');
    }
    return this.authService.refresh(token, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(user.userId, res);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me/tenants')
  @UseGuards(JwtAuthGuard)
  getMeTenants(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMeTenants(user.userId);
  }

  @Post('switch-tenant')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  switchTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchTenantDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.switchTenant(user.userId, dto.tenantId, res);
  }

  @Post('impersonate/exchange')
  @HttpCode(HttpStatus.OK)
  impersonateExchange(
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.impersonateService.exchange(code, res);
  }

  @Post('impersonate/end')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  impersonateEnd(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    return this.impersonateService.end(user.actorId ?? user.userId, user.tenantId, ip, res);
  }
}
