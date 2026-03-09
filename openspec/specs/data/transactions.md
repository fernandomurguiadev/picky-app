# Manejo de Transacciones - PickyApp

## 1. Visión General

Las operaciones que modifican múltiples registros deben ser **atómicas**: todas las operaciones se completan exitosamente o ninguna se aplica (rollback automático).

**Principio ACID**:
- **Atomicity**: Todo o nada
- **Consistency**: Estado válido antes y después
- **Isolation**: Transacciones concurrentes no interfieren
- **Durability**: Cambios persisten después del commit

## 2. Casos de Uso Críticos

### 2.1 Creación de Pedido
**Operaciones**:
1. Insertar registro en `orders`
2. Insertar múltiples registros en `order_items`
3. Insertar registro inicial en `order_status_history`

**Riesgo sin transacción**: Pedido creado sin items, o items sin pedido.

### 2.2 Actualización de Producto con Variantes
**Operaciones**:
1. Actualizar registro en `products`
2. Eliminar `option_groups` existentes
3. Insertar nuevos `option_groups`
4. Insertar `option_items` para cada grupo

**Riesgo sin transacción**: Producto sin opciones, o opciones huérfanas.

### 2.3 Eliminación de Categoría
**Operaciones**:
1. Verificar que no tiene productos activos
2. Actualizar productos inactivos a categoría "Sin categoría"
3. Eliminar la categoría

**Riesgo sin transacción**: Productos sin categoría válida.

## 3. Implementación en TypeORM

### 3.1 Usando QueryRunner (Recomendado)

```typescript
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private dataSource: DataSource
  ) {}

  async createOrder(dto: CreateOrderDto, tenantId: string): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    // Conectar y comenzar transacción
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Operación 1: Crear pedido
      const order = queryRunner.manager.create(Order, {
        tenantId,
        orderNumber: await this.generateOrderNumber(tenantId),
        status: 'new',
        ...dto
      });
      await queryRunner.manager.save(order);
      
      // Operación 2: Crear items del pedido
      const orderItems = dto.items.map(item => 
        queryRunner.manager.create(OrderItem, {
          orderId: order.id,
          ...item
        })
      );
      await queryRunner.manager.save(orderItems);
      
      // Operación 3: Crear registro de historial
      const statusHistory = queryRunner.manager.create(OrderStatusHistory, {
        orderId: order.id,
        status: 'new',
        changedBy: null // Sistema
      });
      await queryRunner.manager.save(statusHistory);
      
      // Commit: todas las operaciones exitosas
      await queryRunner.commitTransaction();
      
      return order;
      
    } catch (error) {
      // Rollback: alguna operación falló
      await queryRunner.rollbackTransaction();
      throw error;
      
    } finally {
      // Liberar conexión
      await queryRunner.release();
    }
  }
}
```

### 3.2 Usando @Transaction Decorator

```typescript
import { Transaction, TransactionRepository } from 'typeorm';

@Injectable()
export class CatalogService {
  @Transaction()
  async updateProductWithOptions(
    productId: string,
    dto: UpdateProductDto,
    @TransactionRepository(Product) productRepo?: Repository<Product>,
    @TransactionRepository(OptionGroup) optionGroupRepo?: Repository<OptionGroup>
  ): Promise<Product> {
    // Actualizar producto
    await productRepo.update(productId, {
      name: dto.name,
      price: dto.price
    });
    
    // Eliminar opciones existentes
    await optionGroupRepo.delete({ productId });
    
    // Crear nuevas opciones
    const optionGroups = dto.optionGroups.map(group =>
      optionGroupRepo.create({ productId, ...group })
    );
    await optionGroupRepo.save(optionGroups);
    
    return productRepo.findOne({ where: { id: productId } });
  }
}
```

### 3.3 Usando DataSource.transaction()

```typescript
@Injectable()
export class CatalogService {
  constructor(private dataSource: DataSource) {}

  async deleteCategory(categoryId: string, tenantId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Verificar que no tiene productos activos
      const activeProducts = await manager.count(Product, {
        where: { categoryId, isActive: true }
      });
      
      if (activeProducts > 0) {
        throw new ConflictException(
          `La categoría tiene ${activeProducts} productos activos`
        );
      }
      
      // Mover productos inactivos a "Sin categoría"
      const uncategorizedId = await this.getUncategorizedId(tenantId);
      await manager.update(Product, 
        { categoryId },
        { categoryId: uncategorizedId }
      );
      
      // Eliminar la categoría
      await manager.delete(Category, { id: categoryId });
    });
  }
}
```

## 4. Niveles de Aislamiento

TypeORM usa el nivel de aislamiento por defecto de PostgreSQL: **READ COMMITTED**.

### Niveles Disponibles

| Nivel | Descripción | Uso en PickyApp |
| :--- | :--- | :--- |
| READ UNCOMMITTED | Lee cambios no commiteados | ❌ No usar |
| READ COMMITTED | Lee solo cambios commiteados (default) | ✅ Mayoría de casos |
| REPEATABLE READ | Misma lectura en toda la transacción | ⚠️ Reportes críticos |
| SERIALIZABLE | Máximo aislamiento | ⚠️ Solo si es necesario |

### Cambiar Nivel de Aislamiento

```typescript
await queryRunner.startTransaction('SERIALIZABLE');
```

### Caso de Uso: Prevenir Double-Booking

```typescript
async reserveProduct(productId: string, quantity: number): Promise<void> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  
  // Usar SERIALIZABLE para evitar race conditions
  await queryRunner.startTransaction('SERIALIZABLE');
  
  try {
    // Leer stock actual
    const product = await queryRunner.manager.findOne(Product, {
      where: { id: productId },
      lock: { mode: 'pessimistic_write' } // Lock para escritura
    });
    
    if (product.stock < quantity) {
      throw new ConflictException('Stock insuficiente');
    }
    
    // Actualizar stock
    await queryRunner.manager.update(Product, productId, {
      stock: product.stock - quantity
    });
    
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

## 5. Locks (Bloqueos)

### Pessimistic Locking

```typescript
// Bloquear fila para escritura (otros deben esperar)
const product = await productRepository.findOne({
  where: { id: productId },
  lock: { mode: 'pessimistic_write' }
});

// Bloquear fila para lectura (permite otras lecturas)
const product = await productRepository.findOne({
  where: { id: productId },
  lock: { mode: 'pessimistic_read' }
});
```

### Optimistic Locking

```typescript
@Entity('products')
export class Product {
  @VersionColumn()
  version: number;
  
  // ... otros campos
}

// TypeORM verifica automáticamente la versión al actualizar
// Si la versión cambió, lanza OptimisticLockVersionMismatchError
```

## 6. Manejo de Errores

### Errores Comunes

```typescript
try {
  await this.createOrder(dto, tenantId);
} catch (error) {
  if (error.code === '23505') {
    // Violación de constraint UNIQUE
    throw new ConflictException('El pedido ya existe');
  }
  
  if (error.code === '23503') {
    // Violación de FK
    throw new BadRequestException('Producto no encontrado');
  }
  
  if (error.name === 'QueryFailedError') {
    // Error de query SQL
    this.logger.error('Query failed', error);
    throw new InternalServerErrorException('Error al crear pedido');
  }
  
  throw error;
}
```

### Deadlocks

```typescript
async retryOnDeadlock<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === '40P01' && attempt < maxRetries) {
        // Deadlock detectado, reintentar
        this.logger.warn(`Deadlock detected, retry ${attempt}/${maxRetries}`);
        await this.delay(100 * attempt); // Backoff exponencial
        continue;
      }
      throw error;
    }
  }
}
```

## 7. Buenas Prácticas

### ✅ DO

1. **Usar transacciones para operaciones relacionadas**
```typescript
// Crear pedido + items + historial en una transacción
await this.dataSource.transaction(async (manager) => {
  const order = await manager.save(Order, orderData);
  await manager.save(OrderItem, itemsData);
  await manager.save(OrderStatusHistory, historyData);
});
```

2. **Mantener transacciones cortas**
```typescript
// ✅ CORRECTO: Transacción rápida
await this.dataSource.transaction(async (manager) => {
  await manager.save(order);
  await manager.save(items);
});

// ❌ INCORRECTO: Transacción larga con operaciones lentas
await this.dataSource.transaction(async (manager) => {
  await manager.save(order);
  await this.sendEmail(order); // ❌ Operación lenta
  await this.uploadToS3(order); // ❌ Operación lenta
});
```

3. **Liberar recursos en finally**
```typescript
try {
  await queryRunner.startTransaction();
  // operaciones
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release(); // ✅ Siempre liberar
}
```

### ❌ DON'T

1. **No anidar transacciones**
```typescript
// ❌ INCORRECTO
await this.dataSource.transaction(async (manager1) => {
  await this.dataSource.transaction(async (manager2) => {
    // Transacción anidada
  });
});
```

2. **No hacer operaciones lentas dentro de transacciones**
```typescript
// ❌ INCORRECTO
await this.dataSource.transaction(async (manager) => {
  await manager.save(order);
  await this.httpClient.post('external-api', data); // ❌ Lento
  await this.sleep(5000); // ❌ Bloquea la transacción
});
```

3. **No ignorar errores de rollback**
```typescript
// ❌ INCORRECTO
try {
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction(); // Puede fallar también
}

// ✅ CORRECTO
try {
  await queryRunner.commitTransaction();
} catch (error) {
  try {
    await queryRunner.rollbackTransaction();
  } catch (rollbackError) {
    this.logger.error('Rollback failed', rollbackError);
  }
  throw error;
}
```

## 8. Testing de Transacciones

```typescript
describe('OrdersService - createOrder', () => {
  it('should rollback if order items fail to save', async () => {
    // Arrange
    const dto = { items: [invalidItem] };
    
    // Act & Assert
    await expect(service.createOrder(dto, tenantId))
      .rejects.toThrow();
    
    // Verificar que no se creó el pedido
    const orders = await orderRepository.find();
    expect(orders).toHaveLength(0);
  });
  
  it('should commit all changes if successful', async () => {
    // Arrange
    const dto = { items: [validItem] };
    
    // Act
    const order = await service.createOrder(dto, tenantId);
    
    // Assert
    expect(order.id).toBeDefined();
    const items = await orderItemRepository.find({ where: { orderId: order.id } });
    expect(items).toHaveLength(1);
  });
});
```
