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
import { CatalogService } from './catalog.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto.js';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  getAll(@TenantId() tenantId: string) {
    return this.catalogService.getAdminCategories(tenantId);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(tenantId, dto);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalogService.updateCategory(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.catalogService.deleteCategory(tenantId, id);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(@TenantId() tenantId: string, @Body() dto: ReorderCategoriesDto) {
    await this.catalogService.reorderCategories(tenantId, dto);
  }
}
