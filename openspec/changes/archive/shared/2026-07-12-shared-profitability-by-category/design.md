# Technical Design: Filtros de Categoría y Búsqueda de Producto en Rentabilidad

## Arquitectura

Una sola tabla, dos filtros opcionales encima — no hay "modos" separados. Sin `categoryId`/`search`, se ve la lista completa de `byProduct` (comportamiento actual, sin cambios). Con cualquiera de los dos, el backend devuelve el mismo `byProduct` ya acotado — la tabla no cambia de forma, solo de contenido.

Mirror exacto del patrón ya usado en `admin/catalog/products/page.tsx`: `SearchBar` (`app/src/components/shared/search-bar`, debounce 300ms incorporado) + `Select` con `useCategories()`.

## Backend

`ProfitabilityQueryDto` (`api/src/modules/reports/dto/profitability-query.dto.ts`):
```typescript
@IsString()
@IsOptional()
search?: string;
```

`ReportsService.aggregateByProduct` — agregar, junto a los `andWhere` existentes:
```typescript
if (search) {
  qb.andWhere('oi.productName ILIKE :search', { search: `%${search}%` });
}
```
Sin join nuevo — opera sobre `OrderItem.productName`, ya presente en el `SELECT`/`GROUP BY` actual.

## Frontend

`app/src/app/(admin)/admin/reports/page.tsx`:
- Estado local `categoryId: string | undefined` y `search: string`.
- `useProfitability({ from, to, categoryId, search: search || undefined })` — no enviar `search: ""` (evitar filtro vacío innecesario).
- Fila de filtros entre el header y las `MetricCard` (o entre las cards y la tabla — visualmente pegado a la tabla que filtran, ya que los totales/`MetricCard` NO se filtran por categoría/producto, solo `byProduct`).

**Decisión de diseño**: los totales (`revenue`/`cost`/`grossMargin` a nivel `MetricCard`) también vienen filtrados por `categoryId`/`search` porque el backend aplica el filtro sobre la MISMA query que arma `byProduct`, y `sumTotals` sea sobre ese `byProduct` ya acotado (ver `reports.service.ts#getProfitability`) — no hay forma de mostrar "totales sin filtrar + tabla filtrada" sin una segunda request. Se documenta para que no sea sorpresa: filtrar por categoría también cambia los `MetricCard` de arriba, lo cual es coherente (estás viendo la rentabilidad de esa categoría, no la general).

## Testing

- `reports.service.spec.ts`: nuevo test — `search` filtra `byProduct` por `ILIKE` sobre `productName`; combinable con `categoryId`.
- Frontend: verificación manual (no hay suite de tests de componentes en `app/` para paneles admin existente que replicar).
