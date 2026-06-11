import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { QueryRunner } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantId } from '../../common/decorators/tenant-id.decorator.js';
import { RlsRunner } from '../../common/decorators/rls-runner.decorator.js';
import { QrFlyerService } from './qr-flyer.service.js';

@Controller('stores')
export class QrFlyerController {
  constructor(private readonly qrFlyerService: QrFlyerService) {}

  @Get('me/qr-flyer')
  @UseGuards(JwtAuthGuard)
  async downloadQrFlyer(
    @TenantId() tenantId: string,
    @RlsRunner() runner: QueryRunner | undefined,
    @Query('logo') logo: string | undefined,
    @Query('colors') colors: string | undefined,
    @Res() res: Response,
  ) {
    const includeLogo = logo !== 'false';
    const useColors = colors !== 'false';

    const pdf = await this.qrFlyerService.generateFlyer(
      tenantId,
      { includeLogo, useColors },
      runner,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="flyer-qr.pdf"',
      'Content-Length': String(pdf.length),
    });
    res.end(pdf);
  }
}
