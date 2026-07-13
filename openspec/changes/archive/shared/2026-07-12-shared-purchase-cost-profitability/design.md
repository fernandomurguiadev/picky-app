# Technical Design: Precio de Compra y Panel de Rentabilidad

## Arquitectura

### Fase 1 — Modelo de datos
- `Product.costPrice: number | null` — columna `integer` nullable, misma unidad que `price` (centavos). No usar `decimal(15,2)` aunque sea la convención genérica de `db-agent`: en esta tabla `price` ya es `integer`, y mezclar tipos entre columnas monetarias hermanas de la misma entidad sería inconsistente y más riesgoso que seguir la convención local ya establecida.
- `OrderItem.unitCost: number | null` — columna `integer` nullable, snapshot de `product.costPrice`.
- Ningún módulo nuevo en Fase 1: se modifican `catalog` y `orders` in-place.

### Fase 2 — Reportes
- Módulo nuevo `api/src/modules/reports/` (sigue la estructura estándar de `backend-agent`: `reports.module.ts`, `reports.controller.ts`, `reports.service.ts`, `dto/`).
- Nuevo guard `api/src/common/guards/feature.guard.ts` + decorator `api/src/common/decorators/require-feature.decorator.ts`, análogos a `RolesGuard`/`@Roles`, que llaman a `FeatureService.hasFeature(tenantId, code)`.
- **No existe hoy ningún consumidor real de `RolesGuard` ni de `FeatureService.hasFeature`** fuera del módulo `platform` — este change es su primera integración real en un endpoint de negocio. Se documenta explícitamente para no subestimar el esfuerzo en `tasks.md`.

## Modelo de Datos

```typescript
// Product (api/src/modules/catalog/entities/product.entity.ts)
@Column({ type: 'integer', nullable: true, default: null })
costPrice!: number | null;

// OrderItem (api/src/modules/orders/entities/order-item.entity.ts)
@Column({ type: 'integer', nullable: true, default: null })
unitCost!: number | null;
```

Ambas columnas requieren `npm run migration:generate` — el agente NUNCA escribe la migración a mano (regla innegociable de `db-agent`/CLAUDE.md). **Ya generada** por el usuario: `api/src/migrations/1783905259807-Migration.ts` (agrega `unitCost` a `order_items` y `costPrice` a `products`, con `down()` simétrico). Falta correr `npm run migration:run`.

## Snapshot de Costo (Fase 1)

Ubicación exacta: `api/src/modules/orders/orders.service.ts`, dentro del `.map` que hoy arma:

```typescript
return { ...item, unitPrice: product.price };
```

Se agrega en el mismo objeto:

```typescript
return { ...item, unitPrice: product.price, unitCost: product.costPrice };
```

- `unitCost` NUNCA se agrega a `CreateOrderItemDto` — se deriva 100% server-side, igual que `unitPrice` (ver comentario ya existente "Validate and override client-supplied prices with server-side DB prices").
- Si `product.costPrice` es `null`, `unitCost` queda `null` — no bloquea la creación del pedido.

## Exclusión de Costo en Endpoints Existentes

**Revisión de diseño — reconciliado con trabajo en paralelo.** La primera versión de este documento proponía un whitelist manual por método (`toPublicProduct` en `catalog.service.ts`, `stripItemCosts` en `orders.service.ts`) para excluir `costPrice`/`unitCost` del storefront público y de `AdminOrdersController`. Mientras se implementaba, en paralelo se agregó un mecanismo global más sistémico: `TransformInterceptor` (`api/src/common/interceptors/transform.interceptor.ts`) ahora llama `instanceToPlain(value, { groups: [role] })` de `class-transformer`, y `Product.costPrice`/`OrderItem.unitCost` llevan `@Expose({ groups: [UserRole.ADMIN] })`. Se adoptó este mecanismo como fuente única de verdad y se eliminó el whitelist manual, por ser más robusto (protege cualquier endpoint HTTP nuevo automáticamente, sin tener que acordarse de excluir el campo a mano en cada uno).

**Bug corregido**: los decoradores originales usaban `@Expose({ groups: ['ADMIN'] })` (mayúsculas), pero el rol que viaja en el JWT es el valor real de `UserRole.ADMIN = 'admin'` (minúsculas, seteado en `auth.service.ts` al firmar el token). Como `class-transformer` compara grupos por igualdad exacta de string, esto hacía que `costPrice`/`unitCost` **nunca** se expusieran, ni siquiera a administradores reales. Se corrigió importando `UserRole` y usando `@Expose({ groups: [UserRole.ADMIN] })` en ambas entidades.

**Verificación empírica**: `Order.items` es `unknown[]` sin decorador `@Type(() => OrderItem)`. Se verificó con un test descartable (`class-transformer` real, vía jest) que `instanceToPlain` SÍ recorre arrays anidados de instancias de clase y aplica sus propios `@Expose`/`@Exclude`, incluso sin `@Type()` — confirmado con `groups: []` → sin `unitCost`, `groups: ['staff']` → sin `unitCost`, `groups: ['admin']` → con `unitCost`. Sin este chequeo, remover el whitelist manual hubiera sido una apuesta a ciegas.

**Excepción — el WebSocket no queda cubierto**: `OrdersGateway.emitOrderNew` (`api/src/modules/orders/orders.gateway.ts:59`) usa `socket.io`'s `.emit()` directo, que NO pasa por ningún interceptor HTTP de Nest — el class-serializer global no protege ese canal. `orders.service.ts` sigue llamando `stripItemCosts` (ahora usado *solo* para este caso) justo antes de `emitOrderNew`, sobre una copia superficial del pedido, para no afectar la respuesta HTTP (que sí usa el serializer por rol).

1. **Storefront público** (`GET /api/v1/stores/:slug/products`, `/products/featured`, `/products/search`): cubierto por el serializer global — `role` es `undefined` en requests sin JWT (`@SkipRls`), así que `groups: []` y `costPrice` se excluye automáticamente.
2. **`AdminOrdersController`** (`GET /admin/orders`, `GET /admin/orders/:id`): cubierto por el mismo mecanismo — un `STAFF` autenticado recibe `groups: ['staff']`, que no matchea `[UserRole.ADMIN]`, así que `unitCost` se excluye sin necesitar un guard de rol en ese controller (que sigue sin tenerlo, y está bien así: el field-level hiding no depende de bloquear el endpoint completo).

## Guard de Rol y de Feature (Fase 2)

```typescript
// api/src/modules/reports/reports.controller.ts
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@Roles('admin')
@RequireFeature(FeatureCode.ANALYTICS)
export class ReportsController {
  @Get('profitability')
  getProfitability(@TenantId() tenantId: string, @Query() query: ProfitabilityQueryDto) { ... }
}
```

`FeatureGuard` (nuevo):
```typescript
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector, private featureService: FeatureService) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const code = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!code) return true;
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId; // NO usar request.tenantId acá — ver nota abajo
    return this.featureService.hasFeature(tenantId, code);
  }
}
```

**Gap detectado en la revisión — orden real del pipeline de Nest**: en NestJS, **todos los Guards se ejecutan antes que cualquier Interceptor** (no al revés, pese a como lo describe el diagrama de `backend-agent.md`). `request.tenantId` lo setea `TenantContextInterceptor` (`api/src/common/interceptors/tenant-context.interceptor.ts`, registrado global vía `APP_INTERCEPTOR` en `app.module.ts:105`) — un Interceptor. Un Guard que lea `request.tenantId` (como hace `TenantGuard`, `api/src/common/guards/tenant.guard.ts`) leería `undefined`, porque el interceptor todavía no corrió. Esto probablemente explica por qué **`TenantGuard` tampoco está aplicado a ningún endpoint hoy** — mismo problema latente que `RolesGuard`.
`FeatureGuard` evita este problema leyendo `request.user?.tenantId` directamente — ese valor lo pone `JwtAuthGuard` (Passport, vía `JwtStrategy.validate()`) que es OTRO Guard, y dentro de `@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)` los guards corren en orden secuencial (uno detrás de otro), así que `request.user.tenantId` ya está disponible para cuando `FeatureGuard` se ejecuta.

Fail-closed: si `hasFeature` lanza o el tenant no tiene el feature, `canActivate` devuelve `false` → NestJS responde `403 Forbidden` (no hay try/catch que abra la puerta). Si `request.user?.tenantId` es `undefined` (no debería pasar detrás de `JwtAuthGuard`), `hasFeature` recibe `undefined`, no encuentra tenant y devuelve `false` — también fail-closed.

## Regla de Agregación de Rentabilidad

`OrderStatus` real: `pending | confirmed | preparing | ready | delivered | cancelled` (no existen `paid`/`pending_payment`). Regla: `WHERE o.status IN ('confirmed','preparing','ready','delivered')`.

Cálculo por producto y totales, en `ReportsService`, usando query builder sobre `order_items` con join a `orders` (filtro `tenantId` + `status` + rango de fechas) y join a `products` (para `productName`/`categoryId` actuales — no hace falta, `OrderItem.productName` ya está snapshoteado).

```sql
-- boceto conceptual, no el SQL final
SELECT oi."productId", oi."productName",
       SUM(oi.quantity) AS "unitsSold",
       SUM(oi.subtotal) FILTER (WHERE oi."unitCost" IS NOT NULL) AS revenue,
       SUM(oi."unitCost" * oi.quantity) FILTER (WHERE oi."unitCost" IS NOT NULL) AS cost,
       COUNT(*) FILTER (WHERE oi."unitCost" IS NULL) AS "unitsMissingCost"
FROM order_items oi
JOIN orders o ON o.id = oi."orderId"
WHERE o."tenantId" = :tenantId
  AND o.status IN ('confirmed','preparing','ready','delivered')
  AND o."createdAt" BETWEEN :from AND :to
GROUP BY oi."productId", oi."productName"
```

**Nota de diseño (gap corregido en la revisión)**: `revenue` usa `oi.subtotal` (ya calculado como `(unitPrice + Σ priceModifier) * quantity`), no `unitPrice * quantity` recalculado — así el ingreso incluye correctamente los modificadores de opciones (ej. tamaño grande). `cost` en cambio usa `unitCost * quantity` sin modificadores, porque el costo a nivel de opción está fuera de scope (ver "Costo a nivel de opción/variante" en el proposal) — el margen de productos con opciones caras puede quedar levemente sobreestimado, limitación conocida y ya documentada.
`revenue`/`cost` se calculan solo sobre ítems con `unitCost != null` (para no promediar productos con costo cargado con productos sin costo bajo el mismo total). Las unidades sin costo se cuentan aparte en `unitsMissingCost` y no afectan el margen.

`comparison` (período anterior) se resuelve con la misma query, corriéndola dos veces (rango actual + rango anterior de igual duración) — no una sola query con ventaneo, para mantener el código simple en la primera versión. Si `revenue` del período anterior es `0` o no hay filas, cada campo de `PeriodComparison` devuelve `null`.

## Frontend

### Fase 1
- `product-form/index.tsx`: nuevo `Controller` para `costPrice`, reutilizando el componente `PriceInput` ya definido en el mismo archivo. Label `"Precio de compra (en pesos)"`. El `disabled={isGroupPriced}` que hoy tiene el `PriceInput` de `price` **no se replica** en el de `costPrice`.
- Conversión: `fromCents`/`toCents` de `@/lib/utils/currency`, igual que `price` (no usar el alias `tosCents`, marcado deprecado).
- Zod schema del form: `costPrice` opcional, `z.number().int().min(0).nullable().optional()`.

### Fase 2
- Nueva sección `app/src/app/(admin)/admin/reports/page.tsx` (o `admin/reports/profitability/page.tsx`), gateada visualmente por el feature `ANALYTICS` (si el hook de features indica que no está disponible, mostrar upsell en vez del dato — mismo patrón que otras features del plan).
- Hook TanStack Query `useProfitability(query)` en `app/src/lib/hooks/admin/use-reports.ts`.
- UI: `MetricCard` (reuso del componente ya usado en `admin/dashboard`) para revenue/cost/margen + variación vs. período anterior, y una tabla para el desglose por producto. Sin librería de gráficos nueva en esta iteración.

## Manejo de Errores

- `hasFeature()` ya captura sus propios errores internamente y devuelve `false` (fail-closed) — `FeatureGuard` no necesita try/catch adicional.
- División por cero en `marginPercent`/`comparison`: siempre chequear `revenue === 0` antes de dividir → devolver `0` para `marginPercent` (hay ingreso pero no hay período, no aplica "sin datos") y `null` para los campos de `comparison` cuando el período de referencia no tiene datos.

## Testing

- Unit test de `orders.service.ts`: snapshot de `unitCost` cuando el producto tiene costo, y cuando no (`null`).
- Unit test de `ReportsService`: agregación excluye `pending`/`cancelled`; ítems con `unitCost = null` no distorsionan `marginPercent`; `comparison` da `null` sin pedidos previos.
- Integration test de `ReportsController`: `403` para `STAFF`; `403` para tenant sin `ANALYTICS`; `200` con datos correctos para `ADMIN` con el feature habilitado.
- Test de serialización: `GET /admin/orders/:id` como `STAFF` no incluye `unitCost` en ningún item (vía class-serializer); como `ADMIN`, sí lo incluye.
- Test de `OrdersGateway`/`createOrder`: el payload emitido por `emitOrderNew` nunca incluye `unitCost`, independientemente del rol de quien esté conectado al room del tenant.
