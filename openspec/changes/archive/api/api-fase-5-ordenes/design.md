# Design — api-fase-5-ordenes

## Estructura de archivos resultante

```
api/
└── src/
    └── modules/
        └── orders/
            ├── dto/
            │   ├── create-order.dto.ts          ← NUEVO
            ├── dto/
            │   ├── create-order-admin.dto.ts    ← NUEVO
            │   ├── update-order-status.dto.ts   ← NUEVO
            │   ├── update-order-notes.dto.ts    ← NUEVO
            │   └── orders-query.dto.ts          ← NUEVO
            ├── errors/
            │   ├── orders.error-codes.ts        ← NUEVO
            │   └── orders.errors.ts             ← NUEVO
            ├── enums/                           ← YA EXISTE (order.enums.ts)
            ├── entities/                        ← YA EXISTE
            ├── orders.service.ts                ← NUEVO
            ├── orders.controller.ts             ← NUEVO
            └── orders.module.ts                 ← NUEVO
```

---

## DTOs

### `create-order.dto.ts` (tienda pública)

```typescript
export class CreateOrderItemDto {
  @IsUUID('4') productId: string;
  @IsString() @MaxLength(255) productName: string;
  @IsInt() @Min(1) unitPrice: number;       // centavos
  @IsInt() @Min(1) quantity: number;
  @IsArray() @ValidateNested({ each: true }) selectedOptions: SelectedOptionDto[];
  @IsString() @IsOptional() itemNote?: string;
}

export class SelectedOptionDto {
  @IsUUID('4') groupId: string;
  @IsString() groupName: string;
  @IsUUID('4') itemId: string;
  @IsString() itemName: string;
  @IsInt() priceModifier: number;           // centavos, puede ser 0
}

export class CustomerInfoDto {
  @IsString() @MaxLength(255) name: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() address?: string;
}

export class CreateOrderDto {
  @IsUUID('4') tenantId: string;
  @IsEnum(DeliveryMethod) deliveryMethod: DeliveryMethod;
  @IsEnum(PaymentMethod)  paymentMethod: PaymentMethod;
  @ValidateNested() @Type(() => CustomerInfoDto) customer: CustomerInfoDto;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto) items: CreateOrderItemDto[];
  @IsString() @IsOptional() notes?: string;
}
```

### `update-order-status.dto.ts`

```typescript
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus) status: OrderStatus;
  @IsString() @IsOptional() note?: string;
}
```

### `orders-query.dto.ts`

```typescript
export class OrdersQueryDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
```

---

## Mapa de transiciones de estado

```typescript
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]:   [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING,  OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY,       OrderStatus.CANCELLED],
  [OrderStatus.READY]:     [OrderStatus.DELIVERED,   OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};
```

---

## Generador de `orderNumber`

```typescript
private generateOrderNumber(): string {
  const date = new Date();
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ORD-${yyyymmdd}-${rand}`;
}
```

---

## `orders.service.ts` — métodos

| Método | Descripción |
|--------|-------------|
| `createOrder(dto)` | Carga StoreSettings del tenant, valida métodos y monto mínimo, calcula totales, persiste en transacción |
| `getAdminOrders(tenantId, query)` | QueryBuilder con filtros, paginación, retorna `{ data, total }` |
| `getAdminOrderById(tenantId, id)` | Carga orden con items. Verifica ownership. |
| `updateOrderStatus(tenantId, id, dto)` | Valida transición, agrega a `statusHistory`, persiste |
| `createAdminOrder(tenantId, dto)` | Igual a `createOrder` pero tenantId viene del JWT |
| `updateOrderNotes(tenantId, id, dto)` | Solo actualiza `internalNotes` |

---

## Validaciones en `createOrder`

1. Cargar `StoreSettings` del `dto.tenantId` → 404 si no existe
2. Si `deliveryMethod === DELIVERY` y `!settings.deliveryEnabled` → 422
3. Si `deliveryMethod === TAKEAWAY` y `!settings.takeawayEnabled` → 422
4. Si `deliveryMethod === IN_STORE` y `!settings.inStoreEnabled` → 422
5. Validar método de pago habilitado (cash/transfer/card) → 422
6. Calcular `subtotal = sum(item.unitPrice * item.quantity + sum(option.priceModifier * item.quantity))`
7. Si `deliveryMethod === DELIVERY` y `settings.deliveryMinOrder > 0` y `subtotal < settings.deliveryMinOrder` → 422
8. `deliveryCost = deliveryMethod === DELIVERY ? settings.deliveryCost : 0`
9. `total = subtotal + deliveryCost`
10. Generar `orderNumber`
11. Persistir `Order` + `OrderItem[]` en transacción

---

## Errores del dominio

```typescript
export const OrderErrorCodes = {
  ORDER_NOT_FOUND:              'ORDER_NOT_FOUND',
  ORDER_FORBIDDEN:              'ORDER_FORBIDDEN',
  INVALID_STATUS_TRANSITION:    'INVALID_STATUS_TRANSITION',
  DELIVERY_NOT_ENABLED:         'DELIVERY_NOT_ENABLED',
  PAYMENT_METHOD_NOT_ENABLED:   'PAYMENT_METHOD_NOT_ENABLED',
  BELOW_MINIMUM_ORDER:          'BELOW_MINIMUM_ORDER',
  TENANT_SETTINGS_NOT_FOUND:    'TENANT_SETTINGS_NOT_FOUND',
};
```

---

## `orders.controller.ts` — estructura

```typescript
// Público
@Controller('orders')
@Post()  → createOrder(dto)   // sin guard

// Admin
@Controller('admin/orders')
@UseGuards(JwtAuthGuard)
@Get()            → getAdminOrders(tenantId, query)
@Get(':id')       → getAdminOrderById(tenantId, id)
@Post()           → createAdminOrder(tenantId, dto)
@Patch(':id/status') → updateOrderStatus(tenantId, id, dto)
@Patch(':id/notes')  → updateOrderNotes(tenantId, id, dto)
```

---

## `orders.module.ts`

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    // StoreSettings para validaciones de createOrder
    TypeOrmModule.forFeature([StoreSettings]),
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],  // para que el Gateway lo pueda inyectar en FASE 6
})
export class OrdersModule {}
```
