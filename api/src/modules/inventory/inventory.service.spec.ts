import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { InventoryService } from './inventory.service.js';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity.js';
import { Product } from '../catalog/entities/product.entity.js';

// ── Factories ──────────────────────────────────────────────────────────────

const T_ID = 'tenant-a';
const P_ID = 'prod-1';

function makeProduct(partial: Partial<Product> = {}): Product {
  return {
    id: P_ID,
    tenantId: T_ID,
    name: 'Producto Test',
    price: 1000,
    inStock: true,
    stockQuantity: 10,
    ...partial,
  } as Product;
}

function makeMovement(partial: Partial<StockMovement> = {}): StockMovement {
  return {
    id: 'mov-1',
    tenantId: T_ID,
    productId: P_ID,
    type: StockMovementType.SALE_OUT,
    quantity: 2,
    notes: null,
    orderId: null,
    createdBy: null,
    createdAt: new Date(),
    ...partial,
  } as StockMovement;
}

function makeManager(
  product: Product | null,
  movement: StockMovement,
): jest.Mocked<EntityManager> {
  return {
    findOne: jest.fn().mockResolvedValue(product),
    save: jest.fn().mockImplementation((_entity: unknown, data: unknown) =>
      Promise.resolve(data),
    ),
    create: jest.fn().mockReturnValue(movement),
  } as unknown as jest.Mocked<EntityManager>;
}

// ── Spec ───────────────────────────────────────────────────────────────────

describe('InventoryService', () => {
  let service: InventoryService;

  const mockProductRepo = { find: jest.fn(), findOne: jest.fn() };
  const mockStockMovementRepo = { findAndCount: jest.fn() };
  const mockQueryRunner = {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {} as EntityManager,
  };
  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(StockMovement), useValue: mockStockMovementRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();
    service = module.get(InventoryService);
  });

  // ── 7.1 — Decremento SALE_OUT ────────────────────────────────────────────

  describe('createMovement — SALE_OUT (7.1)', () => {
    it('decrementa stockQuantity y mantiene inStock true cuando quedan unidades', async () => {
      const product = makeProduct({ stockQuantity: 5 });
      const movement = makeMovement({ type: StockMovementType.SALE_OUT, quantity: 2 });
      const manager = makeManager(product, movement);

      const result = await service.createMovement(
        T_ID,
        P_ID,
        { type: StockMovementType.SALE_OUT, quantity: 2, orderId: 'order-1' },
        manager,
      );

      expect(manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({ stockQuantity: 3, inStock: true }),
      );
      expect(manager.create).toHaveBeenCalledWith(
        StockMovement,
        expect.objectContaining({
          type: StockMovementType.SALE_OUT,
          quantity: 2,
          orderId: 'order-1',
        }),
      );
      expect(result).toBe(movement);
    });

    it('pone inStock = false cuando stockQuantity llega exactamente a 0', async () => {
      const product = makeProduct({ stockQuantity: 3 });
      const movement = makeMovement({ type: StockMovementType.SALE_OUT, quantity: 3 });
      const manager = makeManager(product, movement);

      await service.createMovement(
        T_ID,
        P_ID,
        { type: StockMovementType.SALE_OUT, quantity: 3 },
        manager,
      );

      expect(manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({ stockQuantity: 0, inStock: false }),
      );
    });
  });

  // ── 7.2 — Restauración CANCELLATION_RETURN ───────────────────────────────

  describe('createMovement — CANCELLATION_RETURN (7.2)', () => {
    it('restaura stockQuantity e inStock al cancelar orden', async () => {
      const product = makeProduct({ stockQuantity: 0, inStock: false });
      const movement = makeMovement({
        type: StockMovementType.CANCELLATION_RETURN,
        quantity: 3,
      });
      const manager = makeManager(product, movement);

      await service.createMovement(
        T_ID,
        P_ID,
        { type: StockMovementType.CANCELLATION_RETURN, quantity: 3, orderId: 'order-1' },
        manager,
      );

      expect(manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({ stockQuantity: 3, inStock: true }),
      );
      expect(manager.create).toHaveBeenCalledWith(
        StockMovement,
        expect.objectContaining({
          type: StockMovementType.CANCELLATION_RETURN,
          orderId: 'order-1',
        }),
      );
    });
  });

  // ── 7.3 — Guard de stock insuficiente ────────────────────────────────────

  describe('createMovement — stock insuficiente (7.3)', () => {
    it('lanza ConflictException sin modificar el producto cuando qty > stockQuantity', async () => {
      const product = makeProduct({ stockQuantity: 1 });
      const manager = makeManager(product, makeMovement());

      await expect(
        service.createMovement(
          T_ID,
          P_ID,
          { type: StockMovementType.SALE_OUT, quantity: 2 },
          manager,
        ),
      ).rejects.toThrow(ConflictException);

      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  // ── 7.5 — Toggle manual: stockQuantity null ──────────────────────────────

  describe('createMovement — producto sin control de stock (7.5)', () => {
    it('lanza ConflictException cuando el producto tiene stockQuantity null', async () => {
      const product = makeProduct({ stockQuantity: null });
      const manager = makeManager(product, makeMovement());

      await expect(
        service.createMovement(
          T_ID,
          P_ID,
          { type: StockMovementType.PURCHASE_IN, quantity: 10 },
          manager,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── 7.6 — RLS: filtrado por tenantId ─────────────────────────────────────

  describe('getProductsWithStock (7.6)', () => {
    it('siempre pasa tenantId en el where (RLS proxy en unit)', async () => {
      const products = [makeProduct()];
      mockProductRepo.find.mockResolvedValue(products);

      const result = await service.getProductsWithStock(T_ID);

      expect(mockProductRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: T_ID }) }),
      );
      expect(result).toBe(products);
    });
  });

  describe('getMovements (7.6)', () => {
    it('filtra movimientos por tenantId y productId', async () => {
      const movements = [makeMovement()];
      mockStockMovementRepo.findAndCount.mockResolvedValue([movements, 1]);

      const { data, total } = await service.getMovements(T_ID, P_ID, {
        page: 1,
        limit: 20,
      });

      expect(mockStockMovementRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: T_ID, productId: P_ID } }),
      );
      expect(data).toBe(movements);
      expect(total).toBe(1);
    });
  });

  // ── Tipos de movimiento adicionales ──────────────────────────────────────

  describe('createMovement — tipos adicionales', () => {
    it('PURCHASE_IN incrementa stockQuantity', async () => {
      const product = makeProduct({ stockQuantity: 5 });
      const movement = makeMovement({ type: StockMovementType.PURCHASE_IN, quantity: 10 });
      const manager = makeManager(product, movement);

      await service.createMovement(
        T_ID,
        P_ID,
        { type: StockMovementType.PURCHASE_IN, quantity: 10 },
        manager,
      );

      expect(manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({ stockQuantity: 15, inStock: true }),
      );
    });

    it('WASTE decrementa stockQuantity', async () => {
      const product = makeProduct({ stockQuantity: 10 });
      const movement = makeMovement({ type: StockMovementType.WASTE, quantity: 3 });
      const manager = makeManager(product, movement);

      await service.createMovement(
        T_ID,
        P_ID,
        { type: StockMovementType.WASTE, quantity: 3 },
        manager,
      );

      expect(manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({ stockQuantity: 7 }),
      );
    });

    it('lanza NotFoundException cuando el producto no existe', async () => {
      const manager = makeManager(null, makeMovement());

      await expect(
        service.createMovement(
          T_ID,
          P_ID,
          { type: StockMovementType.PURCHASE_IN, quantity: 5 },
          manager,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Manejo de queryRunner propio ──────────────────────────────────────────

  describe('createMovement — sin externalManager', () => {
    it('hace commit y libera el queryRunner en caso exitoso', async () => {
      const product = makeProduct({ stockQuantity: 5 });
      const movement = makeMovement({ type: StockMovementType.PURCHASE_IN });
      const manager = makeManager(product, movement);
      mockQueryRunner.manager = manager;

      await service.createMovement(T_ID, P_ID, {
        type: StockMovementType.PURCHASE_IN,
        quantity: 3,
      });

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('hace rollback y libera el runner ante NotFoundException', async () => {
      const manager = makeManager(null, makeMovement());
      mockQueryRunner.manager = manager;

      await expect(
        service.createMovement(T_ID, P_ID, {
          type: StockMovementType.PURCHASE_IN,
          quantity: 5,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
