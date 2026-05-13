import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { toBusinessException } from '../../common/errors/business.exception.js';
import { Category } from './entities/category.entity.js';
import { OptionGroup } from './entities/option-group.entity.js';
import { OptionItem } from './entities/option-item.entity.js';
import { Product } from './entities/product.entity.js';
import { CatalogErrors } from './errors/catalog.errors.js';
import { Tenant } from '../tenants/entities/tenant.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { OrderStatus } from '../orders/enums/order.enums.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';
import type { ReorderCategoriesDto } from './dto/reorder-categories.dto.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';
import type { ProductsQueryDto } from './dto/pagination-query.dto.js';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(OptionGroup)
    private readonly optionGroupRepo: Repository<OptionGroup>,
    @InjectRepository(OptionItem)
    private readonly optionItemRepo: Repository<OptionItem>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async resolveTenantBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { slug, isActive: true } });
    if (!tenant) throw toBusinessException(CatalogErrors.tenantNotFound(slug));
    return tenant;
  }

  // ─── Categories (public) ──────────────────────────────────────────────────

  async getPublicCategories(slug: string): Promise<Category[]> {
    const tenant = await this.resolveTenantBySlug(slug);
    return this.categoryRepo.find({
      where: { tenantId: tenant.id, isActive: true },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  // ─── Categories (admin) ───────────────────────────────────────────────────

  async getAdminCategories(tenantId: string): Promise<Category[]> {
    return this.categoryRepo.find({
      where: { tenantId },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async createCategory(tenantId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepo.create({
      tenantId,
      name: dto.name,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
    });
    return this.categoryRepo.save(category);
  }

  async updateCategory(
    tenantId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw toBusinessException(CatalogErrors.categoryNotFound(id));
    if (category.tenantId !== tenantId) throw toBusinessException(CatalogErrors.categoryForbidden(id));

    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(tenantId: string, id: string): Promise<void> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw toBusinessException(CatalogErrors.categoryNotFound(id));
    if (category.tenantId !== tenantId) throw toBusinessException(CatalogErrors.categoryForbidden(id));

    const activeCount = await this.productRepo.count({
      where: { categoryId: id },
    });
    if (activeCount > 0) {
      throw toBusinessException(CatalogErrors.categoryHasActiveProducts(id, activeCount));
    }

    await this.categoryRepo.remove(category);
  }

  async reorderCategories(tenantId: string, dto: ReorderCategoriesDto): Promise<void> {
    const categories = await this.categoryRepo.find({
      where: { id: In(dto.ids) },
      select: ['id', 'tenantId'],
    });

    const allBelongToTenant = categories.every((c) => c.tenantId === tenantId);
    if (!allBelongToTenant || categories.length !== dto.ids.length) {
      throw toBusinessException(CatalogErrors.reorderForbidden());
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (let i = 0; i < dto.ids.length; i++) {
        await queryRunner.manager.update(Category, dto.ids[i]!, { order: i });
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ─── Products (public) ────────────────────────────────────────────────────

  async getPublicProducts(
    slug: string,
    categoryId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Product[]; total: number }> {
    const tenant = await this.resolveTenantBySlug(slug);

    const [data, total] = await this.productRepo.findAndCount({
      where: { tenantId: tenant.id, categoryId, isActive: true },
      relations: ['optionGroups', 'optionGroups.items'],
      order: { order: 'ASC', name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async getFeaturedProducts(slug: string): Promise<Product[]> {
    const tenant = await this.resolveTenantBySlug(slug);
    return this.productRepo.find({
      where: { tenantId: tenant.id, isFeatured: true, isActive: true },
      relations: ['optionGroups', 'optionGroups.items'],
      order: { order: 'ASC' },
      take: 10,
    });
  }

  async searchProducts(slug: string, q: string): Promise<Product[]> {
    const safeQ = q.slice(0, 100);
    const tenant = await this.resolveTenantBySlug(slug);
    return this.productRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId: tenant.id })
      .andWhere('p.isActive = true')
      .andWhere('(p.name ILIKE :q OR p.description ILIKE :q)', { q: `%${safeQ}%` })
      .leftJoinAndSelect('p.optionGroups', 'og')
      .leftJoinAndSelect('og.items', 'oi')
      .orderBy('p.name', 'ASC')
      .take(50)
      .getMany();
  }

  // ─── Products (admin) ─────────────────────────────────────────────────────

  async getAdminProducts(
    tenantId: string,
    query: ProductsQueryDto,
  ): Promise<{ data: Product[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('p.optionGroups', 'og')
      .leftJoinAndSelect('og.items', 'oi')
      .orderBy('p.order', 'ASC')
      .addOrderBy('p.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.categoryId) {
      qb.andWhere('p.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('p.isActive = :isActive', { isActive: query.isActive === 'true' });
    }
    if (query.q) {
      qb.andWhere('(p.name ILIKE :q OR p.description ILIKE :q)', { q: `%${query.q}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async createProduct(tenantId: string, dto: CreateProductDto): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const product = queryRunner.manager.create(Product, {
        tenantId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        imageUrl: dto.imageUrl ?? null,
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
        order: dto.order ?? 0,
      });
      const saved = await queryRunner.manager.save(product);

      if (dto.optionGroups?.length) {
        await this.saveOptionGroups(queryRunner.manager, saved.id, dto.optionGroups);
      }

      await queryRunner.commitTransaction();
      return this.productRepo.findOneOrFail({
        where: { id: saved.id },
        relations: ['optionGroups', 'optionGroups.items'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateProduct(
    tenantId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw toBusinessException(CatalogErrors.productNotFound(id));
    if (product.tenantId !== tenantId) throw toBusinessException(CatalogErrors.productForbidden(id));

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { optionGroups, ...rest } = dto;
      await queryRunner.manager.update(Product, id, rest);

      if (optionGroups !== undefined) {
        await queryRunner.manager.delete(OptionGroup, { productId: id });
        if (optionGroups.length) {
          await this.saveOptionGroups(queryRunner.manager, id, optionGroups);
        }
      }

      await queryRunner.commitTransaction();
      return this.productRepo.findOneOrFail({
        where: { id },
        relations: ['optionGroups', 'optionGroups.items'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateProductStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
  ): Promise<{ id: string; isActive: boolean }> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw toBusinessException(CatalogErrors.productNotFound(id));
    if (product.tenantId !== tenantId) throw toBusinessException(CatalogErrors.productForbidden(id));

    await this.productRepo.update(id, { isActive });
    return { id, isActive };
  }

  async deleteProduct(tenantId: string, id: string): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw toBusinessException(CatalogErrors.productNotFound(id));
    if (product.tenantId !== tenantId) throw toBusinessException(CatalogErrors.productForbidden(id));

    const activeOrders = await this.orderRepo
      .createQueryBuilder('o')
      .innerJoin('o.items', 'oi', 'oi.productId = :pid', { pid: id })
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.status NOT IN (:...done)', {
        done: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      })
      .getCount();

    if (activeOrders > 0) {
      throw toBusinessException(CatalogErrors.productHasActiveOrders(id));
    }

    await this.productRepo.remove(product);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async saveOptionGroups(
    manager: DataSource['manager'],
    productId: string,
    groups: Array<{ name: string; type: string; isRequired?: boolean; minSelections?: number; maxSelections?: number; order?: number; items: Array<{ name: string; priceModifier: number; isDefault?: boolean; order?: number }> }>,
  ): Promise<void> {
    for (const g of groups) {
      const group = manager.create(OptionGroup, {
        productId,
        name: g.name,
        type: g.type as OptionGroup['type'],
        isRequired: g.isRequired ?? false,
        minSelections: g.minSelections ?? 0,
        maxSelections: g.maxSelections ?? 1,
        order: g.order ?? 0,
      });
      const savedGroup = await manager.save(group);

      const items = g.items.map((item, idx) =>
        manager.create(OptionItem, {
          optionGroupId: savedGroup.id,
          name: item.name,
          priceModifier: item.priceModifier,
          isDefault: item.isDefault ?? false,
          order: item.order ?? idx,
        }),
      );
      await manager.save(items);
    }
  }
}
