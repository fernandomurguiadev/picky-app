import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  QueryRunner,
} from 'typeorm';

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
  private readonly logger = new Logger(CatalogService.name);

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
    const tenant = await this.tenantRepo.findOne({
      where: { slug, isActive: true },
    });
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

  async getAdminCategories(
    tenantId: string,
    runner?: QueryRunner,
  ): Promise<Category[]> {
    const repo = runner
      ? runner.manager.getRepository(Category)
      : this.categoryRepo;
    return repo.find({
      where: { tenantId },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async createCategory(
    tenantId: string,
    dto: CreateCategoryDto,
    runner?: QueryRunner,
  ): Promise<Category> {
    const repo = runner
      ? runner.manager.getRepository(Category)
      : this.categoryRepo;
    const category = repo.create({
      tenantId,
      name: dto.name,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
      isGroupPricingEnabled: dto.isGroupPricingEnabled ?? false,
      groupPrice: dto.groupPrice ?? null,
    });
    return repo.save(category);
  }

  async updateCategory(
    tenantId: string,
    id: string,
    dto: UpdateCategoryDto,
    runner?: QueryRunner,
  ): Promise<{ category: Category; updatedProductsCount: number }> {
    if (runner) {
      const repo = runner.manager.getRepository(Category);
      const category = await repo.findOne({ where: { id, tenantId } });
      if (!category)
        throw toBusinessException(CatalogErrors.categoryNotFound(id));

      Object.assign(category, dto);
      const savedCategory = await repo.save(category);

      let updatedProductsCount = 0;
      if (
        savedCategory.isGroupPricingEnabled &&
        savedCategory.groupPrice !== null
      ) {
        const result = await runner.manager.update(
          Product,
          { categoryId: id, tenantId },
          { price: savedCategory.groupPrice },
        );
        updatedProductsCount = result.affected ?? 0;
      }
      return { category: savedCategory, updatedProductsCount };
    } else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const repo = queryRunner.manager.getRepository(Category);
        const category = await repo.findOne({ where: { id, tenantId } });
        if (!category)
          throw toBusinessException(CatalogErrors.categoryNotFound(id));

        Object.assign(category, dto);
        const savedCategory = await repo.save(category);

        let updatedProductsCount = 0;
        if (
          savedCategory.isGroupPricingEnabled &&
          savedCategory.groupPrice !== null
        ) {
          const result = await queryRunner.manager.update(
            Product,
            { categoryId: id, tenantId },
            { price: savedCategory.groupPrice },
          );
          updatedProductsCount = result.affected ?? 0;
        }
        await queryRunner.commitTransaction();
        return { category: savedCategory, updatedProductsCount };
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }
  }

  async deleteCategory(
    tenantId: string,
    id: string,
    runner?: QueryRunner,
  ): Promise<void> {
    const categoryRepo = runner
      ? runner.manager.getRepository(Category)
      : this.categoryRepo;
    const productRepo = runner
      ? runner.manager.getRepository(Product)
      : this.productRepo;

    const category = await categoryRepo.findOne({ where: { id, tenantId } });
    if (!category)
      throw toBusinessException(CatalogErrors.categoryNotFound(id));

    const products = await productRepo.find({
      where: { categoryId: id, tenantId },
      select: ['id'],
    });

    if (products.length > 0) {
      const productIds = products.map((p) => p.id);
      const manager = runner ? runner.manager : this.dataSource.manager;

      // stock_movements tiene FK RESTRICT → hay que borrarlos antes que los productos
      await manager
        .query(
          `DELETE FROM "stock_movements" WHERE "productId" = ANY($1) AND "tenantId" = $2`,
          [productIds, tenantId],
        )
        .catch(() => {});

      await productRepo.delete({ categoryId: id, tenantId });
    }

    await categoryRepo.remove(category);
  }

  async reorderCategories(
    tenantId: string,
    dto: ReorderCategoriesDto,
    runner?: QueryRunner,
  ): Promise<void> {
    const repo = runner
      ? runner.manager.getRepository(Category)
      : this.categoryRepo;
    const categories = await repo.find({
      where: { id: In(dto.ids) },
      select: ['id', 'tenantId'],
    });

    const allBelongToTenant = categories.every((c) => c.tenantId === tenantId);
    if (!allBelongToTenant || categories.length !== dto.ids.length) {
      throw toBusinessException(CatalogErrors.reorderForbidden());
    }

    if (runner) {
      for (let i = 0; i < dto.ids.length; i++) {
        await runner.manager.update(Category, dto.ids[i], { order: i });
      }
    } else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        for (let i = 0; i < dto.ids.length; i++) {
          await queryRunner.manager.update(Category, dto.ids[i], { order: i });
        }
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
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

  async searchProducts(
    slug: string,
    q: string,
    opts: { categoryId?: string; page?: number; limit?: number } = {},
  ): Promise<{
    data: Product[];
    meta: { page: number; limit: number; total: number; totalPages: number };
    categoryFacets: Array<{ categoryId: string; count: number }>;
  }> {
    const safeQ = q.slice(0, 100);
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(48, Math.max(1, opts.limit ?? 24));
    const tenant = await this.resolveTenantBySlug(slug);

    const searchPattern = `%${safeQ}%`;
    const searchCondition = 'p.name ILIKE :searchQ';

    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId: tenant.id })
      .andWhere('p.isActive = true')
      .andWhere(searchCondition, { searchQ: searchPattern })
      .leftJoinAndSelect('p.optionGroups', 'og')
      .leftJoinAndSelect('og.items', 'oi')
      .orderBy('p.name', 'ASC');

    if (opts.categoryId) {
      qb.andWhere('p.categoryId = :categoryId', {
        categoryId: opts.categoryId,
      });
    }

    const [total, data] = await Promise.all([
      qb.getCount(),
      qb
        .clone()
        .skip((page - 1) * limit)
        .take(limit)
        .getMany(),
    ]);

    // Facets: categorías con resultados para este término (sin filtro de categoría)
    let categoryFacets: Array<{ categoryId: string; count: number }> = [];
    try {
      const facetRows: Array<{ categoryId: string; count: string }> =
        await this.productRepo
          .createQueryBuilder('fp')
          .select('fp.categoryId', 'categoryId')
          .addSelect('COUNT(*)', 'count')
          .where('fp.tenantId = :tenantId', { tenantId: tenant.id })
          .andWhere('fp.isActive = true')
          .andWhere('fp.name ILIKE :searchQ', { searchQ: searchPattern })
          .andWhere('fp.categoryId IS NOT NULL')
          .groupBy('fp.categoryId')
          .getRawMany();

      categoryFacets = facetRows.map((r) => ({
        categoryId: r.categoryId,
        count: Number(r.count),
      }));
    } catch {
      // facets no críticos — no romper la búsqueda principal si fallan
    }

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      categoryFacets,
    };
  }

  // ─── Products (admin) ─────────────────────────────────────────────────────

  async getAdminProducts(
    tenantId: string,
    query: ProductsQueryDto,
    runner?: QueryRunner,
  ): Promise<{ data: Product[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const repo = runner
      ? runner.manager.getRepository(Product)
      : this.productRepo;
    const qb = repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .where('p.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('p.optionGroups', 'og')
      .leftJoinAndSelect('og.items', 'oi')
      .orderBy('p.order', 'ASC')
      .addOrderBy('p.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.categoryId) {
      qb.andWhere('p.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('p.isActive = :isActive', { isActive: query.isActive });
    }
    if (query.search) {
      qb.andWhere('(p.name ILIKE :q OR p.description ILIKE :q)', {
        q: `%${query.search}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getAdminProduct(
    tenantId: string,
    id: string,
    runner?: QueryRunner,
  ): Promise<Product> {
    const repo = runner
      ? runner.manager.getRepository(Product)
      : this.productRepo;
    const product = await repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .leftJoinAndSelect('p.optionGroups', 'og')
      .leftJoinAndSelect('og.items', 'oi')
      .where('p.id = :id AND p.tenantId = :tenantId', { id, tenantId })
      .orderBy('og.order', 'ASC')
      .addOrderBy('oi.order', 'ASC')
      .getOne();

    if (!product) throw toBusinessException(CatalogErrors.productNotFound(id));

    return product;
  }

  async createProduct(
    tenantId: string,
    dto: CreateProductDto,
    runner?: QueryRunner,
  ): Promise<Product> {
    const manager = runner ? runner.manager : null;
    const repo = runner
      ? runner.manager.getRepository(Product)
      : this.productRepo;

    if (runner) {
      const category = await manager!.findOne(Category, {
        where: { id: dto.categoryId },
        select: ['isGroupPricingEnabled', 'groupPrice'],
      });
      const priceToUse =
        category?.isGroupPricingEnabled && category.groupPrice !== null
          ? category.groupPrice
          : dto.price;

      const order =
        dto.order ??
        (await this.getNextProductOrder(tenantId, dto.categoryId, manager!));
      const product = manager!.create(Product, {
        tenantId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description ?? null,
        price: priceToUse,
        imageUrl: dto.imageUrl ?? null,
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
        inStock:
          dto.stockQuantity !== undefined && dto.stockQuantity !== null
            ? dto.stockQuantity > 0
            : (dto.inStock ?? true),
        stockQuantity: dto.stockQuantity ?? null,
        order,
      });
      const saved = await manager!.save(product);

      if (dto.optionGroups?.length) {
        await this.saveOptionGroups(manager!, saved.id, dto.optionGroups);
      }

      return repo.findOneOrFail({
        where: { id: saved.id },
        relations: ['optionGroups', 'optionGroups.items'],
      });
    } else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const category = await queryRunner.manager.findOne(Category, {
          where: { id: dto.categoryId },
          select: ['isGroupPricingEnabled', 'groupPrice'],
        });
        const priceToUse =
          category?.isGroupPricingEnabled && category.groupPrice !== null
            ? category.groupPrice
            : dto.price;

        const order =
          dto.order ??
          (await this.getNextProductOrder(
            tenantId,
            dto.categoryId,
            queryRunner.manager,
          ));
        const product = queryRunner.manager.create(Product, {
          tenantId,
          categoryId: dto.categoryId,
          name: dto.name,
          description: dto.description ?? null,
          price: priceToUse,
          imageUrl: dto.imageUrl ?? null,
          isFeatured: dto.isFeatured ?? false,
          isActive: dto.isActive ?? true,
          inStock:
            dto.stockQuantity !== undefined && dto.stockQuantity !== null
              ? dto.stockQuantity > 0
              : (dto.inStock ?? true),
          stockQuantity: dto.stockQuantity ?? null,
          order,
        });
        const saved = await queryRunner.manager.save(product);

        if (dto.optionGroups?.length) {
          await this.saveOptionGroups(
            queryRunner.manager,
            saved.id,
            dto.optionGroups,
          );
        }

        const result = await queryRunner.manager.findOneOrFail(Product, {
          where: { id: saved.id },
          relations: ['optionGroups', 'optionGroups.items'],
        });
        await queryRunner.commitTransaction();
        return result;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }
  }

  async updateProduct(
    tenantId: string,
    id: string,
    dto: UpdateProductDto,
    runner?: QueryRunner,
  ): Promise<Product> {
    const repo = runner
      ? runner.manager.getRepository(Product)
      : this.productRepo;
    const product = await repo.findOne({ where: { id, tenantId } });
    if (!product) throw toBusinessException(CatalogErrors.productNotFound(id));

    if (runner) {
      const { optionGroups, ...rest } = dto;
      const updateData: any = { ...rest };
      if (rest.stockQuantity !== undefined) {
        updateData.inStock =
          rest.stockQuantity !== null
            ? rest.stockQuantity > 0
            : (rest.inStock ?? product.inStock);
      }

      const catId = dto.categoryId ?? product.categoryId;
      const category = await runner.manager.findOne(Category, {
        where: { id: catId },
        select: ['isGroupPricingEnabled', 'groupPrice'],
      });
      if (category?.isGroupPricingEnabled && category.groupPrice !== null) {
        updateData.price = category.groupPrice;
      }

      await runner.manager.update(Product, id, updateData);

      if (optionGroups !== undefined) {
        await runner.manager.delete(OptionGroup, { productId: id });
        if (optionGroups.length) {
          await this.saveOptionGroups(runner.manager, id, optionGroups);
        }
      }

      return repo.findOneOrFail({
        where: { id },
        relations: ['optionGroups', 'optionGroups.items'],
      });
    } else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const { optionGroups, ...rest } = dto;
        const updateData: any = { ...rest };
        if (rest.stockQuantity !== undefined) {
          updateData.inStock =
            rest.stockQuantity !== null
              ? rest.stockQuantity > 0
              : (rest.inStock ?? product.inStock);
        }

        const catId = dto.categoryId ?? product.categoryId;
        const category = await queryRunner.manager.findOne(Category, {
          where: { id: catId },
          select: ['isGroupPricingEnabled', 'groupPrice'],
        });
        if (category?.isGroupPricingEnabled && category.groupPrice !== null) {
          updateData.price = category.groupPrice;
        }

        await queryRunner.manager.update(Product, id, updateData);

        if (optionGroups !== undefined) {
          await queryRunner.manager.delete(OptionGroup, { productId: id });
          if (optionGroups.length) {
            await this.saveOptionGroups(queryRunner.manager, id, optionGroups);
          }
        }

        const result = await queryRunner.manager.findOneOrFail(Product, {
          where: { id },
          relations: ['optionGroups', 'optionGroups.items'],
        });
        await queryRunner.commitTransaction();
        return result;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }
  }

  async updateProductStatus(
    tenantId: string,
    id: string,
    isActive: boolean,
    runner?: QueryRunner,
  ): Promise<{ id: string; isActive: boolean }> {
    const repo = runner
      ? runner.manager.getRepository(Product)
      : this.productRepo;
    const product = await repo.findOne({ where: { id, tenantId } });
    if (!product) throw toBusinessException(CatalogErrors.productNotFound(id));

    await repo.update(id, { isActive });
    return { id, isActive };
  }

  async updateProductStock(
    tenantId: string,
    id: string,
    inStock: boolean,
    runner?: QueryRunner,
  ): Promise<{ id: string; inStock: boolean }> {
    const repo = runner
      ? runner.manager.getRepository(Product)
      : this.productRepo;
    const product = await repo.findOne({ where: { id, tenantId } });
    if (!product) throw toBusinessException(CatalogErrors.productNotFound(id));

    if (product.stockQuantity !== null) {
      throw toBusinessException(
        CatalogErrors.productStockManagedByQuantity(id),
      );
    }

    await repo.update(id, { inStock });
    return { id, inStock };
  }

  async deleteProduct(
    tenantId: string,
    id: string,
    runner?: QueryRunner,
  ): Promise<void> {
    const productRepo = runner
      ? runner.manager.getRepository(Product)
      : this.productRepo;
    const orderRepo = runner
      ? runner.manager.getRepository(Order)
      : this.orderRepo;

    const product = await productRepo.findOne({ where: { id, tenantId } });
    if (!product) throw toBusinessException(CatalogErrors.productNotFound(id));

    const activeOrders = await orderRepo
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

    const manager = runner ? runner.manager : this.dataSource.manager;
    this.logger.debug(
      `[deleteProduct] Borrando stock_movements para product=${id}`,
    );
    await manager
      .query(
        `DELETE FROM "stock_movements" WHERE "productId" = $1 AND "tenantId" = $2`,
        [id, tenantId],
      )
      .catch((err: unknown) => {
        this.logger.warn(
          `[deleteProduct] No se pudieron borrar stock_movements: ${String(err)}`,
        );
      });
    this.logger.debug(`[deleteProduct] Borrando product=${id}`);
    try {
      await productRepo.delete({ id, tenantId });
      this.logger.debug(`[deleteProduct] product=${id} eliminado OK`);
    } catch (err) {
      this.logger.error(`[deleteProduct] Error al borrar product=${id}`, err);
      throw err;
    }
  }

  async reorderProducts(
    tenantId: string,
    dto: { ids: string[] },
    runner?: QueryRunner,
  ): Promise<void> {
    const repo = runner
      ? runner.manager.getRepository(Product)
      : this.productRepo;
    const products = await repo.find({
      where: { id: In(dto.ids) },
      select: ['id', 'tenantId'],
    });

    const allBelongToTenant = products.every((p) => p.tenantId === tenantId);
    if (!allBelongToTenant || products.length !== dto.ids.length) {
      throw toBusinessException(CatalogErrors.reorderForbidden());
    }

    if (runner) {
      for (let i = 0; i < dto.ids.length; i++) {
        await runner.manager.update(Product, dto.ids[i], { order: i });
      }
    } else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        for (let i = 0; i < dto.ids.length; i++) {
          await queryRunner.manager.update(Product, dto.ids[i], { order: i });
        }
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async getNextProductOrder(
    tenantId: string,
    categoryId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const qb = manager
      ? manager.getRepository(Product).createQueryBuilder('p')
      : this.productRepo.createQueryBuilder('p');
    const row = await qb
      .select('MAX(p.order)', 'maxOrder')
      .where('p.tenantId = :tenantId AND p.categoryId = :categoryId', {
        tenantId,
        categoryId,
      })
      .getRawOne<{ maxOrder: string | null }>();
    const max = row?.maxOrder;
    return max !== null && max !== undefined ? parseInt(max, 10) + 1 : 0;
  }

  private async saveOptionGroups(
    manager: DataSource['manager'],
    productId: string,
    groups: Array<{
      name: string;
      type: string;
      isRequired?: boolean;
      minSelections?: number;
      maxSelections?: number;
      order?: number;
      items: Array<{
        name: string;
        priceModifier: number;
        isDefault?: boolean;
        order?: number;
      }>;
    }>,
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
