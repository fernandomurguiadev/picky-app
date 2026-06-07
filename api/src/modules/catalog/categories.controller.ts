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
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantId } from '../../common/decorators/tenant-id.decorator.js';
import { RlsRunner } from '../../common/decorators/rls-runner.decorator.js';
import type { QueryRunner } from 'typeorm';
import { CatalogService } from './catalog.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto.js';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  getAll(@TenantId() tenantId: string, @RlsRunner() runner: QueryRunner) {
    return this.catalogService.getAdminCategories(tenantId, runner);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() dto: CreateCategoryDto,
    @RlsRunner() runner: QueryRunner,
  ) {
    return this.catalogService.createCategory(tenantId, dto, runner);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @RlsRunner() runner: QueryRunner,
  ) {
    return this.catalogService.updateCategory(tenantId, id, dto, runner);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @RlsRunner() runner: QueryRunner,
  ) {
    await this.catalogService.deleteCategory(tenantId, id, runner);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @TenantId() tenantId: string,
    @Body() dto: ReorderCategoriesDto,
    @RlsRunner() runner: QueryRunner,
  ) {
    await this.catalogService.reorderCategories(tenantId, dto, runner);
  }
}
