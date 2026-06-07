import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, Not, IsNull } from 'typeorm';
import { Product } from '../catalog/entities/product.entity.js';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity.js';
import { CreateStockMovementDto } from './dto/create-movement.dto.js';
import { PaginationQueryDto } from '../catalog/dto/pagination-query.dto.js';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepo: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async getProductsWithStock(tenantId: string): Promise<Product[]> {
    return this.productRepo.find({
      where: {
        tenantId,
        stockQuantity: Not(IsNull()),
      },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async getMovements(
    tenantId: string,
    productId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: StockMovement[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.stockMovementRepo.findAndCount({
      where: { tenantId, productId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async createMovement(
    tenantId: string,
    productId: string,
    dto: {
      type: StockMovementType;
      quantity: number;
      notes?: string | null;
      orderId?: string | null;
      createdBy?: string | null;
    },
    externalManager?: EntityManager,
  ): Promise<StockMovement> {
    const runInTransaction = async (manager: EntityManager) => {
      const product = await manager.findOne(Product, {
        where: { id: productId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(`Producto ${productId} no encontrado`);
      }

      if (product.stockQuantity === null) {
        throw new ConflictException(
          `El producto ${product.name} no tiene habilitada la gestión de stock por cantidad.`,
        );
      }

      const isInput =
        dto.type === StockMovementType.PURCHASE_IN ||
        dto.type === StockMovementType.ADJUSTMENT ||
        dto.type === StockMovementType.CANCELLATION_RETURN;

      const delta = isInput ? dto.quantity : -dto.quantity;
      const newQuantity = product.stockQuantity + delta;

      if (newQuantity < 0) {
        throw new ConflictException(
          `Stock insuficiente para el producto ${product.name}. Stock actual: ${product.stockQuantity}, requerido: ${dto.quantity}.`,
        );
      }

      // Update product cache and inStock status
      product.stockQuantity = newQuantity;
      product.inStock = newQuantity > 0;
      await manager.save(Product, product);

      // Create and save movement record
      const movement = manager.create(StockMovement, {
        tenantId,
        productId,
        type: dto.type,
        quantity: dto.quantity,
        notes: dto.notes ?? null,
        orderId: dto.orderId ?? null,
        createdBy: dto.createdBy ?? null,
      });

      return manager.save(StockMovement, movement);
    };

    if (externalManager) {
      return runInTransaction(externalManager);
    } else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const result = await runInTransaction(queryRunner.manager);
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
}
