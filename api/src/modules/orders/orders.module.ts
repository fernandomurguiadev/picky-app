import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { StoreSettings } from '../tenants/entities/store-settings.entity.js';
import { OrdersService } from './orders.service.js';
import { OrdersGateway } from './orders.gateway.js';
import { StorefrontOrdersController, AdminOrdersController } from './orders.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, StoreSettings]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        publicKey: cfg.get<string>('jwt.publicKey') ?? '',
        verifyOptions: { algorithms: ['RS256' as const] },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [OrdersService, OrdersGateway],
  controllers: [StorefrontOrdersController, AdminOrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
