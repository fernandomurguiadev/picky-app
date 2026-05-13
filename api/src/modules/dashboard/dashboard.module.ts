import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity.js';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardController } from './dashboard.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
