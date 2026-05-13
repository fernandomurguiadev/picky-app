import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { StoreSettings } from '../tenants/entities/store-settings.entity.js';
import { OrdersService } from './orders.service.js';
import { StorefrontOrdersController, AdminOrdersController } from './orders.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, StoreSettings])],
  providers: [OrdersService],
  controllers: [StorefrontOrdersController, AdminOrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
