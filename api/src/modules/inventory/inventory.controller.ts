import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantId } from '../../common/decorators/tenant-id.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { InventoryService } from './inventory.service.js';
import { CreateStockMovementDto } from './dto/create-movement.dto.js';
import { PaginationQueryDto } from '../catalog/dto/pagination-query.dto.js';
import { StockMovementType } from './entities/stock-movement.entity.js';

@Controller('admin/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('products')
  getProducts(@TenantId() tenantId: string) {
    return this.inventoryService.getProductsWithStock(tenantId);
  }

  @Get('products/:id/movements')
  async getMovements(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { data, total } = await this.inventoryService.getMovements(
      tenantId,
      id,
      query,
    );
    return {
      data,
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        total,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }

  @Post('products/:id/movements')
  createMovement(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStockMovementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (
      dto.type === StockMovementType.SALE_OUT ||
      dto.type === StockMovementType.CANCELLATION_RETURN
    ) {
      throw new BadRequestException(
        'Tipo de movimiento no permitido para creación manual.',
      );
    }

    return this.inventoryService.createMovement(tenantId, id, {
      type: dto.type,
      quantity: dto.quantity,
      notes: dto.notes ?? null,
      orderId: null,
      createdBy: user.userId,
    });
  }
}
