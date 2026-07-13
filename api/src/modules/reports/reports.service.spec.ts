import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service.js';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { Product } from '../catalog/entities/product.entity.js';

describe('ReportsService', () => {
  let service: ReportsService;
  let qbMock: {
    innerJoin: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    groupBy: jest.Mock;
    addGroupBy: jest.Mock;
    getRawMany: jest.Mock;
  };

  const mockOrderItemRepo = { createQueryBuilder: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    qbMock = {
      innerJoin: jest.fn(),
      select: jest.fn(),
      addSelect: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      groupBy: jest.fn(),
      addGroupBy: jest.fn(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    // Todos los métodos de encadenamiento devuelven el mismo mock (fluent API)
    Object.values(qbMock).forEach((fn) => {
      if (fn !== qbMock.getRawMany) fn.mockReturnValue(qbMock);
    });
    mockOrderItemRepo.createQueryBuilder.mockReturnValue(qbMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  it('filtra por los estados de venta realizada, excluyendo pending y cancelled', async () => {
    await service.getProfitability('tenant-a', {
      from: '2026-07-01',
      to: '2026-07-31',
    });

    expect(qbMock.andWhere).toHaveBeenCalledWith(
      'o.status IN (:...statuses)',
      { statuses: ['confirmed', 'preparing', 'ready', 'delivered'] },
    );
  });

  it('extiende "to" a fin de día para no truncar el último día del rango', async () => {
    await service.getProfitability('tenant-a', {
      from: '2026-07-01',
      to: '2026-07-31',
    });

    const call = qbMock.andWhere.mock.calls.find(
      (c) => c[0] === 'o.createdAt BETWEEN :from AND :to',
    );
    expect(call).toBeDefined();
    const to: Date = call![1].to;
    expect(to.getUTCHours()).toBe(23);
    expect(to.getUTCMinutes()).toBe(59);
  });

  it('NO joinea con Product cuando no hay filtro de categoría (no descarta productos ya eliminados)', async () => {
    await service.getProfitability('tenant-a', {
      from: '2026-07-01',
      to: '2026-07-31',
    });

    const productJoinCall = qbMock.innerJoin.mock.calls.find(
      (c) => c[0] === Product,
    );
    expect(productJoinCall).toBeUndefined();
  });

  it('joinea con Product SOLO cuando se filtra por categoryId', async () => {
    await service.getProfitability('tenant-a', {
      from: '2026-07-01',
      to: '2026-07-31',
      categoryId: 'cat-1',
    });

    expect(qbMock.innerJoin).toHaveBeenCalledWith(
      Product,
      'p',
      'p.id = oi.productId',
    );
    expect(qbMock.andWhere).toHaveBeenCalledWith('p.categoryId = :categoryId', {
      categoryId: 'cat-1',
    });
  });

  it('filtra por búsqueda parcial (ILIKE) sobre el nombre del producto', async () => {
    await service.getProfitability('tenant-a', {
      from: '2026-07-01',
      to: '2026-07-31',
      search: 'hambur',
    });

    expect(qbMock.andWhere).toHaveBeenCalledWith(
      'oi.productName ILIKE :search',
      { search: '%hambur%' },
    );
  });

  it('combina search y categoryId en la misma consulta sin conflicto', async () => {
    await service.getProfitability('tenant-a', {
      from: '2026-07-01',
      to: '2026-07-31',
      categoryId: 'cat-1',
      search: 'hambur',
    });

    expect(qbMock.andWhere).toHaveBeenCalledWith('p.categoryId = :categoryId', {
      categoryId: 'cat-1',
    });
    expect(qbMock.andWhere).toHaveBeenCalledWith(
      'oi.productName ILIKE :search',
      { search: '%hambur%' },
    );
  });

  it('calcula grossMargin y no distorsiona el margen con unitsMissingCost', async () => {
    qbMock.getRawMany
      .mockResolvedValueOnce([
        {
          productId: 'p1',
          productName: 'Burger',
          unitsSold: '5',
          revenue: '3000',
          cost: '1200',
          unitsMissingCost: '2',
        },
      ])
      .mockResolvedValueOnce([]); // período anterior sin datos

    const result = await service.getProfitability('tenant-a', {
      from: '2026-07-01',
      to: '2026-07-31',
    });

    expect(result.byProduct[0]).toEqual(
      expect.objectContaining({
        unitsSold: 5,
        revenue: 3000,
        cost: 1200,
        grossMargin: 1800,
        unitsMissingCost: 2,
      }),
    );
    expect(result.revenue).toBe(3000);
    expect(result.cost).toBe(1200);
  });

  it('comparison da null en los tres campos cuando el período anterior no tiene datos', async () => {
    qbMock.getRawMany
      .mockResolvedValueOnce([
        {
          productId: 'p1',
          productName: 'Burger',
          unitsSold: '1',
          revenue: '1000',
          cost: '500',
          unitsMissingCost: '0',
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await service.getProfitability('tenant-a', {
      from: '2026-07-01',
      to: '2026-07-31',
    });

    expect(result.comparison).toEqual({
      revenueChangePercent: null,
      costChangePercent: null,
      grossMarginChangePercent: null,
    });
  });

  it('calcula el % de variación vs. período anterior cuando ambos tienen datos', async () => {
    qbMock.getRawMany
      .mockResolvedValueOnce([
        {
          productId: 'p1',
          productName: 'Burger',
          unitsSold: '2',
          revenue: '2000',
          cost: '800',
          unitsMissingCost: '0',
        },
      ])
      .mockResolvedValueOnce([
        {
          productId: 'p1',
          productName: 'Burger',
          unitsSold: '1',
          revenue: '1000',
          cost: '400',
          unitsMissingCost: '0',
        },
      ]);

    const result = await service.getProfitability('tenant-a', {
      from: '2026-07-01',
      to: '2026-07-31',
    });

    expect(result.comparison.revenueChangePercent).toBe(100);
  });
});
