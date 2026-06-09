import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service.js';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { StoreSettings } from '../tenants/entities/store-settings.entity.js';
import { Product } from '../catalog/entities/product.entity.js';
import {
  OrderStatus,
  DeliveryMethod,
  PaymentMethod,
} from './enums/order.enums.js';
import { OrdersGateway } from './orders.gateway.js';
import { ConfigService } from '@nestjs/config';
import { InventoryService } from '../inventory/inventory.service.js';
import { StockMovementType } from '../inventory/entities/stock-movement.entity.js';

// ── Factories ──────────────────────────────────────────────────────────────

const T_ID = 'tenant-a';
const P_ID = 'prod-1';

function makeSettings(partial: Partial<StoreSettings> = {}): StoreSettings {
  return {
    tenantId: T_ID,
    deliveryEnabled: true,
    takeawayEnabled: true,
    inStoreEnabled: true,
    cashEnabled: true,
    transferEnabled: true,
    cardEnabled: true,
    deliveryCost: 0,
    deliveryMinOrder: 0,
    ...partial,
  } as unknown as StoreSettings;
}

function makeProduct(partial: Partial<Product> = {}): Product {
  return {
    id: P_ID,
    tenantId: T_ID,
    name: 'Producto Test',
    price: 1000,
    inStock: true,
    stockQuantity: 5,
    ...partial,
  } as Product;
}

function makeOrder(partial: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    tenantId: T_ID,
    orderNumber: 'ORD-20260609-0001',
    status: OrderStatus.PENDING,
    items: [],
    statusHistory: [
      { status: OrderStatus.PENDING, changedAt: new Date().toISOString() },
    ],
    customerInfo: { name: 'Test', phone: '1234567890', address: null },
    ...partial,
  } as unknown as Order;
}

function makeOrderItem(partial: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 'item-1',
    orderId: 'order-1',
    productId: P_ID,
    productName: 'Producto Test',
    unitPrice: 1000,
    quantity: 2,
    selectedOptions: [],
    itemNote: null,
    subtotal: 2000,
    ...partial,
  } as OrderItem;
}

function makeCreateOrderDto() {
  return {
    tenantId: T_ID,
    deliveryMethod: DeliveryMethod.TAKEAWAY,
    paymentMethod: PaymentMethod.CASH,
    customer: { name: 'Test User', phone: '1234567890', address: null },
    items: [
      {
        productId: P_ID,
        productName: 'Producto Test',
        quantity: 2,
        unitPrice: 1000,
        selectedOptions: [],
        itemNote: null,
      },
    ],
  };
}

// ── Spec ───────────────────────────────────────────────────────────────────

describe('OrdersService — inventory integration', () => {
  let service: OrdersService;
  let mockInventoryService: jest.Mocked<InventoryService>;

  const mockSettingsRepo = { findOne: jest.fn() };
  const mockProductRepo = { findOne: jest.fn() };
  const mockOrderRepo = { findOne: jest.fn(), save: jest.fn() };
  const mockOrderItemRepo = {};

  const mockManager = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    getRepository: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue(undefined),
    manager: mockManager,
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockOrdersGateway = {
    emitOrderNew: jest.fn(),
    emitOrderStatusChanged: jest.fn(),
  };

  const mockConfigService = { get: jest.fn().mockReturnValue('') };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockInventoryService = {
      createMovement: jest.fn().mockResolvedValue({ id: 'mov-1' }),
      getProductsWithStock: jest.fn(),
      getMovements: jest.fn(),
    } as unknown as jest.Mocked<InventoryService>;

    // Default save: devuelve el último argumento
    mockManager.save.mockImplementation((...args: unknown[]) =>
      Promise.resolve(args[args.length - 1]),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },
        { provide: getRepositoryToken(StoreSettings), useValue: mockSettingsRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: OrdersGateway, useValue: mockOrdersGateway },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  // ── 7.1 — createOrder decrementa stock ────────────────────────────────────

  describe('createOrder (7.1)', () => {
    it('llama inventoryService.createMovement con SALE_OUT para producto con stock', async () => {
      const product = makeProduct({ stockQuantity: 5 });
      const order = makeOrder();

      mockSettingsRepo.findOne.mockResolvedValue(makeSettings());
      mockProductRepo.findOne.mockResolvedValue(product);

      mockManager.create.mockImplementation((EntityClass: unknown, data: unknown) => {
        if (EntityClass === Order) return order;
        return { ...(data as object), id: 'item-1' };
      });
      mockManager.findOne.mockResolvedValue(product);

      await service.createOrder(makeCreateOrderDto());

      expect(mockInventoryService.createMovement).toHaveBeenCalledWith(
        T_ID,
        P_ID,
        expect.objectContaining({
          type: StockMovementType.SALE_OUT,
          quantity: 2,
          orderId: 'order-1',
        }),
        mockManager,
      );
    });

    // ── 7.5 — Toggle manual: no afecta stock ─────────────────────────────────

    it('no llama inventoryService.createMovement cuando stockQuantity es null (7.5)', async () => {
      const product = makeProduct({ stockQuantity: null });
      const order = makeOrder();

      mockSettingsRepo.findOne.mockResolvedValue(makeSettings());
      mockProductRepo.findOne.mockResolvedValue(product);

      mockManager.create.mockImplementation((EntityClass: unknown, data: unknown) => {
        if (EntityClass === Order) return order;
        return { ...(data as object), id: 'item-1' };
      });
      mockManager.findOne.mockResolvedValue(product);

      await service.createOrder(makeCreateOrderDto());

      expect(mockInventoryService.createMovement).not.toHaveBeenCalled();
    });

    // ── 7.3 — Race condition: ConflictException → 422 ─────────────────────────

    it('convierte ConflictException de inventario en UnprocessableEntityException 422 (7.3)', async () => {
      const product = makeProduct({ stockQuantity: 5 });
      const order = makeOrder();

      mockSettingsRepo.findOne.mockResolvedValue(makeSettings());
      mockProductRepo.findOne.mockResolvedValue(product);

      mockManager.create.mockImplementation((EntityClass: unknown, data: unknown) => {
        if (EntityClass === Order) return order;
        return { ...(data as object), id: 'item-1' };
      });
      mockManager.findOne.mockResolvedValue(product);

      mockInventoryService.createMovement.mockRejectedValue(
        new ConflictException('Stock insuficiente'),
      );

      await expect(service.createOrder(makeCreateOrderDto())).rejects.toThrow(
        UnprocessableEntityException,
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('rechaza antes de la transacción cuando stockQuantity < quantity solicitado', async () => {
      const product = makeProduct({ stockQuantity: 1, inStock: true });

      mockSettingsRepo.findOne.mockResolvedValue(makeSettings());
      mockProductRepo.findOne.mockResolvedValue(product);

      const dto = makeCreateOrderDto();
      dto.items[0].quantity = 5;

      await expect(service.createOrder(dto)).rejects.toThrow();

      expect(mockQueryRunner.connect).not.toHaveBeenCalled();
      expect(mockInventoryService.createMovement).not.toHaveBeenCalled();
    });
  });

  // ── 7.2 — updateOrderStatus CANCELLED restaura stock ─────────────────────

  describe('updateOrderStatus CANCELLED (7.2)', () => {
    function setupCancelMocks(
      order: Order,
      items: OrderItem[],
      product: Product,
    ) {
      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(order),
      };
      mockManager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      });
      mockManager.find.mockResolvedValue(items);
      mockManager.findOne.mockResolvedValue(product);
    }

    it('llama inventoryService.createMovement con CANCELLATION_RETURN por cada item con stock', async () => {
      const order = makeOrder({ status: OrderStatus.PENDING });
      const item = makeOrderItem({ quantity: 2 });
      const product = makeProduct({ stockQuantity: 0, inStock: false });

      setupCancelMocks(order, [item], product);

      await service.updateOrderStatus(T_ID, 'order-1', {
        status: OrderStatus.CANCELLED,
      });

      expect(mockInventoryService.createMovement).toHaveBeenCalledWith(
        T_ID,
        P_ID,
        expect.objectContaining({
          type: StockMovementType.CANCELLATION_RETURN,
          quantity: 2,
          orderId: 'order-1',
        }),
        mockManager,
      );
    });

    it('no llama inventoryService.createMovement para items sin control de stock (7.5)', async () => {
      const order = makeOrder({ status: OrderStatus.PENDING });
      const item = makeOrderItem();
      const product = makeProduct({ stockQuantity: null });

      setupCancelMocks(order, [item], product);

      await service.updateOrderStatus(T_ID, 'order-1', {
        status: OrderStatus.CANCELLED,
      });

      expect(mockInventoryService.createMovement).not.toHaveBeenCalled();
    });

    // ── 7.2.b — Doble cancelación bloqueada ───────────────────────────────────

    it('lanza error de transición inválida al intentar cancelar una orden ya cancelada (7.2)', async () => {
      const cancelledOrder = makeOrder({ status: OrderStatus.CANCELLED });
      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(cancelledOrder),
      };
      mockManager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      });

      await expect(
        service.updateOrderStatus(T_ID, 'order-1', { status: OrderStatus.CANCELLED }),
      ).rejects.toThrow();

      expect(mockInventoryService.createMovement).not.toHaveBeenCalled();
    });
  });
});
