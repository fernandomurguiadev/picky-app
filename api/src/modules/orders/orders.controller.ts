import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { CreateOrderAdminDto } from './dto/create-order-admin.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { UpdateOrderNotesDto } from './dto/update-order-notes.dto.js';
import { OrdersQueryDto } from './dto/orders-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantId } from '../../common/decorators/tenant-id.decorator.js';

// ─── Tienda pública (sin auth) ────────────────────────────────────────────────

@Controller('orders')
export class StorefrontOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }
}

// ─── Admin (requiere JWT) ─────────────────────────────────────────────────────

@Controller('admin/orders')
@UseGuards(JwtAuthGuard)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getOrders(
    @TenantId() tenantId: string,
    @Query() query: OrdersQueryDto,
  ) {
    return this.ordersService.getAdminOrders(tenantId, query);
  }

  @Get(':id')
  getOrderById(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.getAdminOrderById(tenantId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createAdminOrder(
    @TenantId() tenantId: string,
    @Body() dto: CreateOrderAdminDto,
  ) {
    return this.ordersService.createAdminOrder(tenantId, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(tenantId, id, dto);
  }

  @Patch(':id/notes')
  updateNotes(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderNotesDto,
  ) {
    return this.ordersService.updateOrderNotes(tenantId, id, dto);
  }
}
