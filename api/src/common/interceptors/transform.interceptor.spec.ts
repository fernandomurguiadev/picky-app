import { Reflector } from '@nestjs/core';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor.js';
import { Product } from '../../modules/catalog/entities/product.entity.js';
import { OrderItem } from '../../modules/orders/entities/order-item.entity.js';

function makeContext(role?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
      getResponse: () => ({ statusCode: 200 }),
    }),
    getHandler: () => ({}),
  } as unknown as ExecutionContext;
}

function makeHandler(value: unknown): CallHandler {
  return { handle: () => of(value) } as CallHandler;
}

describe('TransformInterceptor — exclusión de costPrice/unitCost por rol', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor(new Reflector());
  });

  function buildProduct(): Product {
    const product = new Product();
    Object.assign(product, {
      id: 'p1',
      name: 'Burger',
      price: 1000,
      costPrice: 400,
    });
    return product;
  }

  it('excluye costPrice cuando no hay usuario autenticado (storefront público)', async () => {
    const result = (await firstValueFrom(
      interceptor.intercept(makeContext(undefined), makeHandler(buildProduct())),
    )) as { data: Product };

    expect(result.data.price).toBe(1000);
    expect(result.data.costPrice).toBeUndefined();
  });

  it('excluye costPrice para un STAFF autenticado', async () => {
    const result = (await firstValueFrom(
      interceptor.intercept(makeContext('staff'), makeHandler(buildProduct())),
    )) as { data: Product };

    expect(result.data.costPrice).toBeUndefined();
  });

  it('expone costPrice para un ADMIN autenticado', async () => {
    const result = (await firstValueFrom(
      interceptor.intercept(makeContext('admin'), makeHandler(buildProduct())),
    )) as { data: Product };

    expect(result.data.costPrice).toBe(400);
  });

  it('excluye unitCost dentro de Order.items (array anidado sin @Type()) para STAFF', async () => {
    const item = new OrderItem();
    Object.assign(item, {
      id: 'i1',
      productName: 'Burger',
      unitPrice: 1000,
      unitCost: 300,
      quantity: 2,
    });
    const order = { id: 'order-1', items: [item] };

    const result = (await firstValueFrom(
      interceptor.intercept(makeContext('staff'), makeHandler(order)),
    )) as { data: { items: OrderItem[] } };

    expect(result.data.items[0].productName).toBe('Burger');
    expect(result.data.items[0].unitCost).toBeUndefined();
  });

  it('expone unitCost dentro de Order.items para ADMIN', async () => {
    const item = new OrderItem();
    Object.assign(item, {
      id: 'i1',
      productName: 'Burger',
      unitPrice: 1000,
      unitCost: 300,
      quantity: 2,
    });
    const order = { id: 'order-1', items: [item] };

    const result = (await firstValueFrom(
      interceptor.intercept(makeContext('admin'), makeHandler(order)),
    )) as { data: { items: OrderItem[] } };

    expect(result.data.items[0].unitCost).toBe(300);
  });
});
