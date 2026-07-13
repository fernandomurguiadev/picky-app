import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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

const T_ID = 'tenant-a';
const P_ID = 'prod-1';

function makeSettings(): StoreSettings {
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
  } as unknown as StoreSettings;
}

function makeProduct(partial: Partial<Product> = {}): Product {
  return {
    id: P_ID,
    tenantId: T_ID,
    name: 'Producto Test',
    price: 1000,
    costPrice: null,
    inStock: true,
    stockQuantity: null,
    ...partial,
  } as Product;
}

function makeOrder(): Order {
  return {
    id: 'order-1',
    tenantId: T_ID,
    orderNumber: '#0001',
    status: OrderStatus.PENDING,
    items: [],
    statusHistory: [
      { status: OrderStatus.PENDING, changedAt: new Date().toISOString() },
    ],
    customerInfo: { name: 'Test', phone: '1234567890', address: null },
  } as unknown as Order;
}

function makeCreateOrderDto() {
  return {
    tenantId: T_ID,
    deliveryMethod: DeliveryMethod.TAKEAWAY,
    paymentMethod: PaymentMethod.CASH,
    customer: { name: 'Test User', phone: '1234567890', address: undefined },
    items: [
      {
        productId: P_ID,
        productName: 'Producto Test',
        quantity: 2,
        unitPrice: 1000,
        selectedOptions: [],
        itemNote: undefined,
      },
    ],
  };
}

describe('OrdersService — unitCost snapshot', () => {
  let service: OrdersService;

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
    // Simula el INSERT ... RETURNING de tenant_order_sequences
    query: jest.fn().mockResolvedValue([{ last_order_number: 1 }]),
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
  let mockInventoryService: jest.Mocked<InventoryService>;

  let createdItems: Record<string, unknown>[];

  beforeEach(async () => {
    jest.clearAllMocks();
    mockQueryRunner.query.mockResolvedValue([{ last_order_number: 1 }]);
    createdItems = [];

    mockInventoryService = {
      createMovement: jest.fn().mockResolvedValue({ id: 'mov-1' }),
      getProductsWithStock: jest.fn(),
      getMovements: jest.fn(),
    } as unknown as jest.Mocked<InventoryService>;

    mockManager.save.mockImplementation((...args: unknown[]) =>
      Promise.resolve(args[args.length - 1]),
    );
    mockManager.create.mockImplementation(
      (EntityClass: unknown, data: Record<string, unknown>) => {
        if (EntityClass === Order) return makeOrder();
        createdItems.push(data);
        return { ...data, id: `item-${createdItems.length}` };
      },
    );
    mockManager.findOne.mockResolvedValue(null); // sin stockQuantity manejado → no toca inventario

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

  it('snapshotea unitCost desde product.costPrice cuando el producto tiene costo cargado', async () => {
    mockSettingsRepo.findOne.mockResolvedValue(makeSettings());
    mockProductRepo.findOne.mockResolvedValue(makeProduct({ costPrice: 400 }));

    await service.createOrder(makeCreateOrderDto());

    expect(createdItems[0]).toEqual(
      expect.objectContaining({ unitPrice: 1000, unitCost: 400 }),
    );
  });

  it('guarda unitCost = null cuando el producto no tiene costo cargado', async () => {
    mockSettingsRepo.findOne.mockResolvedValue(makeSettings());
    mockProductRepo.findOne.mockResolvedValue(makeProduct({ costPrice: null }));

    await service.createOrder(makeCreateOrderDto());

    expect(createdItems[0]).toEqual(
      expect.objectContaining({ unitPrice: 1000, unitCost: null }),
    );
  });

  it('ignora cualquier unitCost enviado por el cliente — se deriva 100% server-side', async () => {
    mockSettingsRepo.findOne.mockResolvedValue(makeSettings());
    mockProductRepo.findOne.mockResolvedValue(makeProduct({ costPrice: 250 }));

    const dto = makeCreateOrderDto();
    // Payload manipulado: el cliente intenta inyectar su propio unitCost.
    (dto.items[0] as Record<string, unknown>)['unitCost'] = 1;

    await service.createOrder(dto);

    expect(createdItems[0]).toEqual(
      expect.objectContaining({ unitCost: 250 }),
    );
  });

  it('emitOrderNew (WS) nunca incluye unitCost — ese canal no pasa por el class-serializer HTTP', async () => {
    mockSettingsRepo.findOne.mockResolvedValue(makeSettings());
    mockProductRepo.findOne.mockResolvedValue(makeProduct({ costPrice: 400 }));

    await service.createOrder(makeCreateOrderDto());

    expect(mockOrdersGateway.emitOrderNew).toHaveBeenCalledTimes(1);
    const [, emittedOrder] = mockOrdersGateway.emitOrderNew.mock.calls[0] as [
      string,
      { items: Array<Record<string, unknown>> },
    ];
    expect(emittedOrder.items[0]).not.toHaveProperty('unitCost');
    expect(emittedOrder.items[0]).toEqual(
      expect.objectContaining({ unitPrice: 1000 }),
    );
  });
});
