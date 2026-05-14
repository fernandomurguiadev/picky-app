import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantId } from '../../common/decorators/tenant-id.decorator.js';
import { CatalogService } from './catalog.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ReorderProductsDto } from './dto/reorder-products.dto.js';
import { PaginationQueryDto, ProductsQueryDto } from './dto/pagination-query.dto.js';

// ─── Public store routes ───────────────────────────────────────────────────

@Controller('stores/:slug')
export class StorefrontCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  getCategories(@Param('slug') slug: string) {
    return this.catalogService.getPublicCategories(slug);
  }

  @Get('products/featured')
  getFeatured(@Param('slug') slug: string) {
    return this.catalogService.getFeaturedProducts(slug);
  }

  @Get('products/search')
  search(@Param('slug') slug: string, @Query('q') q: string) {
    return this.catalogService.searchProducts(slug, q ?? '');
  }

  @Get('categories/:categoryId/products')
  async getCategoryProducts(
    @Param('slug') slug: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.catalogService.getPublicProducts(slug, categoryId, page, limit);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

// ─── Admin product routes ──────────────────────────────────────────────────

@Controller('admin/products')
@UseGuards(JwtAuthGuard)
export class AdminProductsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async getAll(@TenantId() tenantId: string, @Query() query: ProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.catalogService.getAdminProducts(tenantId, query);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Patch('reorder')
  async reorder(@TenantId() tenantId: string, @Body() dto: ReorderProductsDto) {
    await this.catalogService.reorderProducts(tenantId, dto);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(tenantId, dto);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(tenantId, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.catalogService.updateProductStatus(tenantId, id, isActive);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.catalogService.deleteProduct(tenantId, id);
  }
}
