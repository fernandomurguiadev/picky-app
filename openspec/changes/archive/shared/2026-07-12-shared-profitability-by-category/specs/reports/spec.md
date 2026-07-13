# Delta para Reportes (Reports)

## Funcionalidades Modificadas / Añadidas

| ID | Funcionalidad | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **R-005** | **Búsqueda de Producto por Nombre** | Nuevo filtro `search` (ILIKE parcial) sobre `byProduct`. | Alta |
| **R-006** | **Filtros de Categoría/Búsqueda en la UI** | El panel expone selector de categoría e input de búsqueda que acotan `byProduct`. | Alta |
| **R-007** | **Modo "Márgenes de Catálogo"** | Segundo modo del panel: margen por producto del catálogo completo, sin depender de ventas ni de período. | Alta |

## MODIFIED Requirements

### Requirement: Filtro de Búsqueda por Nombre de Producto

`ProfitabilityQueryDto` MUST aceptar un parámetro `search` opcional (string libre, sin formato UUID), que filtra `byProduct` por coincidencia parcial (`ILIKE`) sobre `OrderItem.productName`.

```typescript
export class ProfitabilityQueryDto {
  from!: string;
  to!: string;
  categoryId?: string; // exacto, ya existente — sin cambios
  productId?: string; // exacto, ya existente — sin cambios
  search?: string; // NUEVO — coincidencia parcial por nombre
}
```
*(Previously: no existía `search`; la única forma de acotar por producto era `productId` exacto).*

- El filtro `search` MUST aplicarse sobre `oi.productName` (el nombre snapshoteado en `OrderItem`, no sobre `Product.name` actual) — consistente con que el resto del reporte ya usa datos snapshoteados y no requiere join a `Product` para este filtro.
- `search` y `categoryId` MUST poder combinarse (ambos son `andWhere` adicionales sobre la misma query).

#### Scenario: Comerciante busca un producto por nombre parcial

- GIVEN un tenant con productos "Hamburguesa Clásica" y "Hamburguesa Doble" vendidos en el período
- WHEN se solicita `GET /admin/reports/profitability?...&search=hambur`
- THEN `byProduct` MUST incluir ambos productos y excluir el resto.

#### Scenario: Comerciante filtra por categoría (sin cambios de comportamiento, ahora accesible desde la UI)

- GIVEN un tenant con productos en varias categorías
- WHEN se solicita el reporte con `categoryId` de una categoría puntual
- THEN `byProduct` MUST incluir únicamente productos de esa categoría — comportamiento ya existente, ahora expuesto en el panel admin.

### Requirement: Controles de Filtro en el Panel de Rentabilidad

El panel admin (`admin/reports`) MUST exponer un selector de categoría y un input de búsqueda de producto, ambos operando sobre la misma tabla `byProduct` ya existente (no se agrega ninguna tabla ni vista nueva).

#### Scenario: Comerciante filtra el listado de productos por categoría

- GIVEN un administrador en el panel de Rentabilidad
- WHEN selecciona una categoría en el selector
- THEN la request a `useProfitability` MUST incluir `categoryId`, y `byProduct` MUST mostrar solo los productos de esa categoría.

#### Scenario: Comerciante busca un producto por nombre

- GIVEN un administrador en el panel de Rentabilidad
- WHEN escribe texto en el input de búsqueda (con debounce)
- THEN la request a `useProfitability` MUST incluir `search`, y `byProduct` MUST mostrar solo los productos cuyo nombre matchea parcialmente.

## ADDED Requirements

### Requirement: Modo "Márgenes de Catálogo"

El panel de Rentabilidad MUST ofrecer un segundo modo, independiente de ventas y de período, que muestre el margen configurado de cada producto del catálogo.

```typescript
// Sin tipo/endpoint nuevo — reutiliza Product ya expuesto por GET /admin/products
// (price, costPrice) para el rol ADMIN vía el class-serializer del change base.
interface CatalogMarginRow {
  productId: string; // Product.id
  productName: string; // Product.name
  price: number;
  costPrice: number | null;
  margin: number | null; // price - costPrice, null si costPrice es null
  marginPercent: number | null;
}
```

- Este modo MUST reutilizar `GET /admin/products` (`ProductsQueryDto`: `categoryId`, `search`, `isActive`) sin agregar ningún endpoint nuevo — el cálculo de margen se hace en el frontend sobre `price`/`costPrice` ya devueltos.
- Productos con `costPrice = null` MUST mostrarse con una indicación explícita ("sin costo cargado"), nunca con un margen de 0% o 100% engañoso.
- MUST reutilizar los mismos controles de filtro (categoría, búsqueda) que el Modo "Ventas reales" — un solo set de controles, no duplicados por modo.

#### Scenario: Comerciante ve el margen configurado de todo su catálogo

- GIVEN un administrador en el panel de Rentabilidad, modo "Márgenes de catálogo"
- WHEN no aplica ningún filtro
- THEN MUST ver todos los productos activos del tenant con su margen unitario, se hayan vendido o no en cualquier período.

#### Scenario: Producto sin costo cargado en modo catálogo

- GIVEN un producto con `costPrice = null`
- WHEN se muestra en el modo "Márgenes de catálogo"
- THEN MUST indicar explícitamente que falta cargar el costo, MUST NOT mostrar un margen calculado con `costPrice` implícito en 0.

## Criterios de Aceptación Modificados / Añadidos

- CA-014: `search` se aplica con `ILIKE` (case-insensitive), igual que el patrón ya usado en `catalog.service.ts#searchProducts`.
- CA-015: `search` y `categoryId` se pueden combinar en la misma consulta sin conflicto.
- CA-016: El selector de categoría reutiliza `useCategories()` ya existente — no se crea un hook de listado nuevo.
- CA-017: El input de búsqueda usa debounce (no dispara un request por cada tecla) — mismo criterio de UX que otros buscadores del admin.
- CA-018: No se agrega ningún desglose agregado por categoría (`byCategory`) al modo "Ventas reales" — el alcance de los filtros ahí es solo acotar el `byProduct` existente.
- CA-019: El modo "Márgenes de catálogo" reutiliza `useProducts()`/`GET /admin/products` — cero endpoints ni DTOs nuevos en el backend.
- CA-020: El toggle entre modos es puramente de UI — cada modo dispara su propio fetch (son fuentes de datos distintas: `order_items` vs `products`), pero cambiar de modo no reinicia los filtros de categoría/búsqueda ya elegidos.
