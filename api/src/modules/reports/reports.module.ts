import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { PlatformModule } from '../platform/platform.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { FeatureGuard } from '../../common/guards/feature.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItem]), PlatformModule],
  controllers: [ReportsController],
  providers: [ReportsService, FeatureGuard],
})
export class ReportsModule {}
