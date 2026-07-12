# Spec: WhatsApp por Tenant y Número de Orden Correlativo

## Archivos afectados

| Archivo | Operación |
| :--- | :--- |
| `api/src/config/env.config.ts` | MODIFY — eliminar `WHATSAPP_BUSINESS_NUMBER` |
| `.env.example.prod` | MODIFY — eliminar línea `WHATSAPP_BUSINESS_NUMBER` |
| `api/src/modules/orders/orders.service.ts` | MODIFY — whatsapp por tenant + secuencia correlativa |
| `api/src/modules/orders/entities/tenant-order-sequence.entity.ts` | ADD — nueva entidad |
| `api/src/modules/orders/orders.module.ts` | MODIFY — registrar nueva entidad |
| `n8n-webhook-whatsapp.json` | MODIFY — actualizar regex y mensaje |
| *(migration)* | ADD — ejecutar `npm run migration:generate` |

---

## 1. Eliminar WHATSAPP_BUSINESS_NUMBER

### `api/src/config/env.config.ts`

Eliminar del schema Zod:
```typescript
// ANTES
WHATSAPP_BUSINESS_NUMBER: z.string().min(1),

// DESPUÉS
// (línea eliminada)
```

### `.env.example.prod`

Eliminar la línea:
```
WHATSAPP_BUSINESS_NUMBER=AQUI_WHATSAPP_NUMBER
```

---

## 2. Nueva entidad TenantOrderSequence

### `api/src/modules/orders/entities/tenant-order-sequence.entity.ts` (ADD)

```typescript
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('tenant_order_sequences')
export class TenantOrderSequence {
  @PrimaryColumn({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'integer', name: 'last_order_number', default: 0 })
  lastOrderNumber!: number;
}
```

### `api/src/modules/orders/orders.module.ts`

Agregar `TenantOrderSequence` al array de entidades del módulo (TypeOrmModule.forFeature).

---

## 3. Modificar OrdersService

### Constructor

Inyectar el repositorio de `TenantOrderSequence`:
```typescript
@InjectRepository(TenantOrderSequence)
private readonly orderSequenceRepo: Repository<TenantOrderSequence>,
```

Eliminar la inyección de `ConfigService` si no tiene otros usos después de este cambio.

### Método `createOrder` — WhatsApp por tenant

Reemplazar el bloque de líneas 200-215 (actual):
```typescript
// ANTES
const businessNumber = this.configService.get<string>('WHATSAPP_BUSINESS_NUMBER', '');
const message = `Hola, quiero confirmar mi pedido ${order.orderNumber}`;
const encodedMessage = encodeURIComponent(message);
const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodedMessage}`;

return {
  ...order,
  whatsappConfirmationMessage: message,
  whatsappConfirmationUrl: whatsappUrl,
} as Order & { ... };
```

Por:
```typescript
// DESPUÉS
const message = `Hola, quiero confirmar mi pedido ${order.orderNumber}`;
const whatsappUrl = settings.whatsapp
  ? `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`
  : null;

return {
  ...order,
  whatsappConfirmationMessage: message,
  whatsappConfirmationUrl: whatsappUrl,
} as Order & {
  whatsappConfirmationMessage: string;
  whatsappConfirmationUrl: string | null;
};
```

> `settings` ya está disponible en scope (cargado al inicio de `createOrder`).

### Método `createOrder` — número de orden correlativo

Reemplazar la línea 112 (`const orderNumber = this.generateOrderNumber()`) por una query
atómica ejecutada dentro del `queryRunner` (después de `startTransaction`):

```typescript
const result = await queryRunner.query<{ last_order_number: number }[]>(
  `INSERT INTO tenant_order_sequences (tenant_id, last_order_number)
   VALUES ($1, 1)
   ON CONFLICT (tenant_id) DO UPDATE
     SET last_order_number = tenant_order_sequences.last_order_number + 1
   RETURNING last_order_number`,
  [dto.tenantId],
);
const orderNumber = `#${String(result[0].last_order_number).padStart(4, '0')}`;
```

> La query usa `INSERT ... ON CONFLICT DO UPDATE` para inicializar la fila lazily en el
> primer pedido del tenant, sin necesitar filas pre-creadas al crear el tenant.
> Al estar dentro de la transacción existente, si la orden falla el número se revierte.

### Eliminar `generateOrderNumber()`

Eliminar el método privado `generateOrderNumber()` (líneas 376-381 del archivo actual).

---

## 4. Actualizar N8N webhook

### `n8n-webhook-whatsapp.json`

Actualizar la regex de extracción de número de orden:
```
// ANTES
/(ORD-\d{8}-\d{4})/

// DESPUÉS
/(#\d{4,})/
```

El mensaje de WhatsApp del cliente ahora es:
```
Hola, quiero confirmar mi pedido #0001
```

---

## Criterios de Aceptación

| ID | Criterio |
| :--- | :--- |
| CA-001 | Si `store_settings.whatsapp` es null, la respuesta retorna `whatsappConfirmationUrl: null` (sin error). |
| CA-002 | Si `store_settings.whatsapp` tiene valor, el link `wa.me` usa ese número. |
| CA-003 | El número de orden del primer pedido de un tenant es `#0001`. |
| CA-004 | Dos pedidos concurrentes del mismo tenant reciben números distintos (no hay colisión). |
| CA-005 | Si la transacción de la orden se revierte, el número de secuencia también se revierte. |
| CA-006 | Los pedidos históricos con formato `ORD-*` no se modifican. |
| CA-007 | `WHATSAPP_BUSINESS_NUMBER` no aparece en ningún archivo del proyecto (excepto git history). |

---

## Notas de Migración

- Ejecutar `npm run migration:generate -- --name CreateTenantOrderSequences` para generar la migración de la nueva tabla.
- No se migran los `orderNumber` existentes — los pedidos históricos mantienen `ORD-YYYYMMDD-RAND4`.
- Actualizar el workflow N8N manualmente en el panel de n8n después del deploy.
