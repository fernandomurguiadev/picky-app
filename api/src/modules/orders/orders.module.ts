import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { StoreSettings } from '../tenants/entities/store-settings.entity.js';
import { Product } from '../catalog/entities/product.entity.js';
import { OrdersService } from './orders.service.js';
import { OrdersGateway } from './orders.gateway.js';
import {
  StorefrontOrdersController,
  AdminOrdersController,
} from './orders.controller.js';
import { ApiKeyGuard } from './guards/api-key.guard.js';
import { InventoryModule } from '../inventory/inventory.module.js';

@Module({
  imports: [
    InventoryModule,
    TypeOrmModule.forFeature([Order, OrderItem, StoreSettings, Product]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        publicKey: cfg.get<string>('jwt.publicKey') ?? '',
        verifyOptions: { algorithms: ['RS256' as const] },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [OrdersService, OrdersGateway, ApiKeyGuard],
  controllers: [StorefrontOrdersController, AdminOrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
