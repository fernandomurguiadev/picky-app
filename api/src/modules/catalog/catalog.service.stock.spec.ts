import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CatalogService } from './catalog.service.js';
import { Category } from './entities/category.entity.js';
import { OptionGroup } from './entities/option-group.entity.js';
import { OptionItem } from './entities/option-item.entity.js';
import { Product } from './entities/product.entity.js';
import { Tenant } from '../tenants/entities/tenant.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { BusinessException } from '../../common/errors/business.exception.js';

// ── Factories ──────────────────────────────────────────────────────────────

const T_ID = 'tenant-a';
const P_ID = 'prod-1';

function makeProduct(partial: Partial<Product> = {}): Product {
  return {
    id: P_ID,
    tenantId: T_ID,
    name: 'Producto Test',
    inStock: true,
    stockQuantity: 5,
    ...partial,
  } as Product;
}

// ── Spec ───────────────────────────────────────────────────────────────────

describe('CatalogService — updateProductStock (7.4)', () => {
  let service: CatalogService;

  const mockProductRepo = { findOne: jest.fn(), update: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: getRepositoryToken(Category), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(OptionGroup), useValue: {} },
        { provide: getRepositoryToken(OptionItem), useValue: {} },
        { provide: getRepositoryToken(Tenant), useValue: {} },
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get(CatalogService);
  });

  // ── 7.4 — Toggle bloqueado cuando stockQuantity activo ───────────────────

  it('lanza BusinessException 409 cuando el producto tiene stockQuantity activo', async () => {
    mockProductRepo.findOne.mockResolvedValue(makeProduct({ stockQuantity: 5 }));

    await expect(
      service.updateProductStock(T_ID, P_ID, false),
    ).rejects.toThrow(BusinessException);

    await expect(
      service.updateProductStock(T_ID, P_ID, false),
    ).rejects.toMatchObject({ status: 409 });

    expect(mockProductRepo.update).not.toHaveBeenCalled();
  });

  // ── 7.5 — Toggle manual funciona cuando stockQuantity es null ────────────

  it('permite toggle manual y actualiza inStock cuando stockQuantity es null', async () => {
    mockProductRepo.findOne.mockResolvedValue(makeProduct({ stockQuantity: null }));
    mockProductRepo.update.mockResolvedValue({ affected: 1 });

    const result = await service.updateProductStock(T_ID, P_ID, false);

    expect(mockProductRepo.update).toHaveBeenCalledWith(
      P_ID,
      expect.objectContaining({ inStock: false }),
    );
    expect(result).toEqual({ id: P_ID, inStock: false });
  });
});
