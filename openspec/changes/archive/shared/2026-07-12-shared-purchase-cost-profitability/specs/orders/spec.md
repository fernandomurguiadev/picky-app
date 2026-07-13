# Delta para Gestión de Pedidos (Orders)

## Funcionalidades Modificadas / Añadidas

| ID | Funcionalidad | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **P-011** | **Snapshot de Costo por Ítem** | Al crear un pedido, se congela el costo vigente del producto en cada `OrderItem`, igual que ya ocurre con `unitPrice`. | Alta |
| **P-012** | **Ocultamiento de Costo en Vista de Pedidos** | `unitCost` no debe filtrarse a través de los endpoints normales de gestión de pedidos del admin. | Alta |

## MODIFIED Requirements

### Requirement: Modelo de Datos del Ítem de Pedido (OrderItem)

`OrderItem` debe registrar el costo unitario vigente al momento de creación del pedido, para que reportes de rentabilidad históricos no se distorsionen si el comerciante actualiza el costo de un producto más adelante.

```typescript
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  unitCost: number | null; // NUEVO — snapshot de Product.costPrice al momento del pedido
  quantity: number;
  selectedOptions: SelectedOption[];
  itemNote: string | null;
  subtotal: number;
  createdAt: Date;
}
```
*(Previously: `OrderItem` no contenía `unitCost`).*

#### Scenario: Snapshot de costo al crear un pedido

- GIVEN un producto con `costPrice = 500` (centavos) al momento de crear un pedido
- WHEN se crea el `OrderItem` correspondiente
- THEN `unitCost` MUST guardarse como `500`, independientemente de cambios futuros en `Product.costPrice`.

#### Scenario: Producto sin costo cargado

- GIVEN un producto con `costPrice = null`
- WHEN se crea un `OrderItem` para ese producto
- THEN `unitCost` MUST guardarse como `null`
- AND ese ítem se excluye del cálculo de margen en los reportes de rentabilidad (ver spec de `reports`), sin bloquear la creación del pedido.

#### Scenario: Cliente intenta manipular el costo al crear un pedido

- GIVEN un payload de creación de pedido armado por un cliente malicioso que incluye un campo `unitCost` propio
- WHEN el pedido se procesa
- THEN el sistema MUST ignorar cualquier `unitCost` provisto por el cliente y derivarlo exclusivamente de `product.costPrice` en el servidor — mismo tratamiento que ya recibe `unitPrice` hoy (ver comentario "Validate and override client-supplied prices with server-side DB prices" en `orders.service.ts`).

### Requirement: Exclusión de Costo en Endpoints Admin de Pedidos

`AdminOrdersController` (`GET /admin/orders`, `GET /admin/orders/:id`) hoy solo aplica `JwtAuthGuard` (sin guard de rol) y devuelve la entidad `Order` con sus `items` sin ningún DTO que filtre columnas. Agregar `unitCost` como columna simple de `OrderItem` lo expondría a cualquier usuario autenticado del tenant, incluido `STAFF` — contradiciendo el requisito de que el margen/costo es información solo para `ADMIN` (ver spec de `reports`).

#### Scenario: STAFF consulta el detalle de un pedido

- GIVEN un usuario con `TenantMembership.role = STAFF` autenticado
- WHEN consulta `GET /admin/orders/:id` o `GET /admin/orders`
- THEN la respuesta MUST NOT incluir el campo `unitCost` de ningún `OrderItem` — se filtra explícitamente (whitelist), sin importar el rol.

#### Scenario: ADMIN consulta el detalle de un pedido

- GIVEN un usuario con `TenantMembership.role = ADMIN`
- WHEN consulta `GET /admin/orders/:id`
- THEN el equipo de producto decide explícitamente en `design.md` si `ADMIN` ve `unitCost` en esta vista puntual o solo a través del panel de Rentabilidad — no debe quedar como comportamiento accidental de "lo que TypeORM devuelve por default".

## Criterios de Aceptación Modificados / Añadidos

- CA-007: El snapshot de `unitCost` ocurre en `orders.service.ts:87` (el mismo `.map` donde hoy se arma `{ ...item, unitPrice: product.price }`) — no hay lectura tardía de `Product.costPrice` en otro punto del flujo.
- CA-008: Cambiar `Product.costPrice` después de creado un pedido NUNCA modifica el `unitCost` de `OrderItem`s ya existentes.
- CA-009: `unitCost` NUNCA se acepta como input del cliente en la creación de pedidos — no se agrega a `CreateOrderItemDto`, se deriva 100% server-side.
- CA-010: `GET /admin/orders` y `GET /admin/orders/:id` MUST excluir `unitCost` de su respuesta (whitelist de columnas), independientemente del rol del usuario autenticado, salvo decisión explícita documentada en `design.md`.
