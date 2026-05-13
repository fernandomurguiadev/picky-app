import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from './entities/category.entity.js';
import { Product } from './entities/product.entity.js';
import { OptionGroup } from './entities/option-group.entity.js';
import { OptionItem } from './entities/option-item.entity.js';
import { Tenant } from '../tenants/entities/tenant.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { CatalogService } from './catalog.service.js';
import { CategoriesController } from './categories.controller.js';
import { AdminProductsController, StorefrontCatalogController } from './products.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Product, OptionGroup, OptionItem, Tenant, Order]),
  ],
  controllers: [CategoriesController, AdminProductsController, StorefrontCatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
