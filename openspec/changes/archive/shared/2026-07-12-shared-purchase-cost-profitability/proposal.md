# Proposal: Precio de Compra y Panel de Rentabilidad

## Intent

Permitir que el comercio cargue, de forma opcional, el precio de compra (costo) de cada producto, y ofrecer un panel de rentabilidad que muestre margen y ganancia bruta por producto, categoría y período. Hoy Picky solo modela el precio de venta — el comerciante no tiene forma de saber cuánto gana realmente por cada pedido dentro de la plataforma.

## Problema Actual

La entidad `Product` (`api/src/modules/catalog/entities/product.entity.ts`) solo tiene el campo `price` (precio de venta, en centavos). No existe ningún campo de costo. El comerciante que quiere saber su margen hoy lo calcula por fuera de Picky (planillas manuales), perdiendo la ventaja de tener venta y costo en un mismo lugar. Además, `OrderItem` ya snapshotea `unitPrice` al momento del pedido (para que cambios futuros de precio no alteren pedidos históricos) — el costo necesita el mismo tratamiento o los reportes de rentabilidad histórica quedarían mal calculados apenas el comerciante actualice un costo.

## Solución en Dos Fases

---

### Fase 1 — Carga de Costo (modelo de datos)

#### Backend (`api/`)
- Agregar columna `costPrice` (integer, centavos, **nullable**) a `Product`. Nunca obligatorio: muchos comercios no van a quererlo cargar.
- Actualizar `CreateProductDto` / `UpdateProductDto` con `costPrice` opcional (`@IsInt() @Min(0) @IsOptional()`).
- **Excluir `costPrice` de cualquier serialización pública** — el endpoint de storefront (`/api/v1/stores/:slug/products`) jamás debe exponer costo. Solo los endpoints de admin (`products.controller.ts` bajo guard de tenant/admin) lo devuelven.
- Agregar columna `unitCost` (integer, centavos, nullable) a `OrderItem`, snapshoteada desde `product.costPrice` en `orders.service.ts:87`, el mismo punto exacto donde hoy se hace `{ ...item, unitPrice: product.price }` (bajo el comentario "Validate and override client-supplied prices with server-side DB prices"). Si el producto no tiene costo cargado, `unitCost` queda `null`. **`unitCost` NUNCA se acepta desde el cliente** — se deriva 100% server-side, igual que `unitPrice`.
- **Gap detectado**: `AdminOrdersController` (`GET /admin/orders`, `GET /admin/orders/:id`) hoy solo tiene `@UseGuards(JwtAuthGuard)` — sin guard de rol — y devuelve la entidad `Order` con sus `items` tal cual (`leftJoinAndSelect('o.items', 'i')` / `relations: ['items']`), sin DTO que filtre columnas. Si `unitCost` se agrega como columna simple, se filtra a cualquier usuario autenticado del tenant (incluido `STAFF`) a través de la vista normal de pedidos — rompiendo la restricción "el margen es solo para ADMIN" definida en la Fase 2. Este change MUST excluir `unitCost` de la respuesta de esos dos endpoints (whitelist explícito de columnas, o guard de rol si se decide que `STAFF` no debería ver ni el pedido completo).
- Requiere `npm run migration:generate` (dos columnas nuevas) — el usuario debe ejecutarlo, no se genera manualmente.

#### Frontend Admin (`app/`)
- En `product-form/index.tsx`: nuevo campo opcional "Precio de compra", reutilizando el mismo componente `PriceInput` y el mismo patrón que ya usa `price` (input de pesos enteros, signo "$" superpuesto, sin decimales/coma) — no se crea un input nuevo.
- Label: `"Precio de compra (en pesos)"`, igual que `"Precio (en pesos)"` — **en ningún texto visible al usuario (label, placeholder, tooltip, mensaje de error o ayuda) se debe mencionar "centavos" ni "cents"**. Esa es una unidad de almacenamiento interna (`costPrice` en la API, convertida con `toCents`/`fromCents` de `@/lib/utils/currency` — no usar el alias deprecado `tosCents`), no un concepto que el comerciante necesite conocer.
- Mostrar de forma no intrusiva (colapsado/opcional) para no complejizar el flujo de alta rápida de producto.
- **`costPrice` es independiente del precio grupal de categoría**: hoy `PriceInput` para `price` se deshabilita (`disabled={isGroupPriced}`) cuando la categoría tiene `groupPrice` fijo. El input de "Precio de compra" NO debe deshabilitarse en ese caso — el costo de compra no tiene relación con el mecanismo de precio grupal de venta.

---

### Fase 2 — Panel de Rentabilidad

#### Backend (`api/`)
- Nuevo endpoint de agregación (p. ej. `GET /api/v1/admin/reports/profitability`) que calcula ingresos, costo, margen bruto ($) y margen (%) — filtrable por rango de fechas, categoría y producto.
- **Corrección**: el `OrderStatus` real (`api/src/modules/orders/enums/order.enums.ts`) es `pending | confirmed | preparing | ready | delivered | cancelled` — no existen los estados `paid`/`pending_payment` (esos son de otro change, de pago online con MercadoPago, todavía no implementado). Regla propuesta para "venta realizada": incluir pedidos en `confirmed`, `preparing`, `ready` o `delivered` (el comerciante ya se comprometió a entregarlos); excluir `pending` (podría rechazarse todavía) y `cancelled`. Confirmar esta regla en `design.md`.
- Los ítems con `unitCost = null` se excluyen del cálculo de margen pero se contabilizan aparte como "sin costo cargado", para que el comerciante sepa que el dato está incompleto y no reciba un número engañoso.
- Restringir el endpoint a `UserRole.ADMIN` (no `STAFF` — el margen es información sensible del negocio, un empleado de mostrador no debería verla), reutilizando `RolesGuard`/`@Roles(...)` (`api/src/common/guards/roles.guard.ts` + `roles.decorator.ts`). **Nota**: esta infraestructura ya existe pero hoy no está aplicada a ningún endpoint del API — este change sería su primer consumidor real, no la continuación de un patrón probado.
- Gatear la funcionalidad con el feature de plan `FeatureCode.ANALYTICS`, usando `FeatureService.hasFeature(tenantId, code)` (`api/src/modules/platform/feature.service.ts:89`). **Nota**: ese método existe pero hoy no lo llama ningún módulo fuera de `platform` — no hay un `FeatureGuard` (decorator-based, análogo a `RolesGuard`) todavía. Este change necesita crear esa pieza chica de infraestructura (o invocar `hasFeature` directo en el controller/service), no es reuso de un gate ya wireado en otro lado.
- **Comparativo vs. período anterior**: el endpoint calcula automáticamente el mismo rango de días inmediatamente anterior al solicitado (ej. si piden julio, compara contra junio) y devuelve la variación porcentual de `revenue`, `cost` y `grossMargin`.

#### Frontend Admin (`app/`)
- Nueva sección `admin/reports` (o tab dentro de `admin/dashboard`): "Rentabilidad" — totales del período con `MetricCard` (mismo componente que ya usa el dashboard) + tabla de top productos por ganancia. `admin/dashboard` no tiene hoy ninguna librería de gráficos instalada; un gráfico de tendencia es una mejora a evaluar en `design.md`, no una dependencia asumida.
- Cada `MetricCard` de totales muestra el comparativo vs. período anterior (ej. "+12% vs. mes pasado"), mismo patrón visual que dashboards de referencia — refuerza el valor percibido del reporte sin costo adicional de query (mismo endpoint).
- Si el tenant no tiene el feature `ANALYTICS` en su plan: mostrar upsell (mismo patrón que otras features gateadas por plan), no el dato.

## Scope por Fase

### Fase 1
- `api/` — columna `costPrice` en `Product`, columna `unitCost` en `OrderItem`, DTOs, exclusión de costo en endpoints públicos, **y exclusión de `unitCost` en `GET /admin/orders` y `GET /admin/orders/:id`** (gap detectado, ver Backend arriba).
- `app/` — campo opcional en form de producto del admin, sin heredar el `disabled` de precio grupal.

### Fase 2
- `api/` — endpoint de agregación de rentabilidad, guard de rol + feature flag.
- `app/` — nueva sección "Rentabilidad" en el panel admin.

## Impacto en Multi-tenancy

- `costPrice` y `unitCost` se leen/escriben siempre filtrados por `tenantId` (igual que el resto de `Product`/`OrderItem`).
- **Crítico**: el costo y el margen son datos comercialmente sensibles — cero exposición cruzada entre tenants, y cero exposición a la tienda pública (storefront) bajo ninguna circunstancia.
- El endpoint de rentabilidad agrega únicamente sobre pedidos del tenant autenticado.

## Out of Scope

- Costo variable por proveedor o historial de cambios de costo (solo se usa el costo vigente al momento del pedido, snapshoteado una vez).
- Gestión de proveedores / órdenes de compra.
- Impuestos, comisiones de pasarela de pago o costos operativos indirectos en el cálculo de margen (solo costo de mercadería vs. precio de venta).
- Exportación de reportes (CSV/PDF) — queda para una fase futura si se valida el uso del panel.
- **Indicador de margen en el listado de catálogo** (`admin/catalog/products`): un chip "Margen: X%" por fila cuando el producto tiene `price` y `costPrice` cargados. Queda documentado como mejora futura de bajo esfuerzo, no se implementa en este change.
- **Alerta de venta a pérdida**: warning visual en `product-form` cuando `costPrice >= price` (mismo estilo que el aviso ámbar de precio heredado ya existente). Queda documentado como mejora futura, no se implementa en este change.
- **Costo a nivel de opción/variante** (`OptionItem`): el modelo de este change asume costo plano por `Product`. Si un producto tiene variantes con `priceModifier` (ej. tamaño grande) cuyo costo real también difiere, ese costo no se captura — el margen de variantes con opciones caras puede quedar subestimado. Limitación conocida, documentada para una eventual Fase 3 si el negocio lo requiere.

## Target Area

- **Admin — Catálogo**: campo opcional de precio de compra en producto.
- **Admin — Nueva sección "Rentabilidad"**: reportes de margen y ganancia.
- **API**: columnas de costo en `Product`/`OrderItem` + endpoint de agregación.
