import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module.js';
import { QrFlyerController } from './qr-flyer.controller.js';
import { QrFlyerService } from './qr-flyer.service.js';

@Module({
  imports: [TenantsModule],
  controllers: [QrFlyerController],
  providers: [QrFlyerService],
})
export class QrFlyerModule {}
