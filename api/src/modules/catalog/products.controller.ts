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
import type { QueryRunner } from 'typeorm';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantId } from '../../common/decorators/tenant-id.decorator.js';
import { RlsRunner } from '../../common/decorators/rls-runner.decorator.js';
import { CatalogService } from './catalog.service.js';
import { SkipRls } from '../../common/decorators/skip-rls.decorator.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ReorderProductsDto } from './dto/reorder-products.dto.js';
import { PaginationQueryDto, ProductsQueryDto } from './dto/pagination-query.dto.js';

// ─── Public store routes ───────────────────────────────────────────────────

@SkipRls()
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
  search(
    @Param('slug') slug: string,
    @Query('q') q: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.searchProducts(slug, q ?? '', {
      categoryId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 24,
    });
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
  async getAll(
    @TenantId() tenantId: string,
    @Query() query: ProductsQueryDto,
    @RlsRunner() runner: QueryRunner,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.catalogService.getAdminProducts(tenantId, query, runner);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get(':id')
  getOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @RlsRunner() runner: QueryRunner,
  ) {
    return this.catalogService.getAdminProduct(tenantId, id, runner);
  }

  @Patch('reorder')
  async reorder(
    @TenantId() tenantId: string,
    @Body() dto: ReorderProductsDto,
    @RlsRunner() runner: QueryRunner,
  ) {
    await this.catalogService.reorderProducts(tenantId, dto, runner);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() dto: CreateProductDto,
    @RlsRunner() runner: QueryRunner,
  ) {
    return this.catalogService.createProduct(tenantId, dto, runner);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @RlsRunner() runner: QueryRunner,
  ) {
    return this.catalogService.updateProduct(tenantId, id, dto, runner);
  }

  @Patch(':id/status')
  updateStatus(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
    @RlsRunner() runner: QueryRunner,
  ) {
    return this.catalogService.updateProductStatus(tenantId, id, isActive, runner);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @RlsRunner() runner: QueryRunner,
  ) {
    await this.catalogService.deleteProduct(tenantId, id, runner);
  }
}
