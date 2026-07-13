# Tasks: Dos Modos de Rentabilidad — Ventas Reales y Márgenes de Catálogo

## Modo A — Ventas reales (filtros)

- [x] 1. API: Agregar `search?: string` a `ProfitabilityQueryDto`
- [x] 2. API: Filtro `ILIKE` sobre `oi.productName` en `ReportsService.aggregateByProduct`
- [x] 3. App: Selector de categoría (`useCategories()` + `Select`) en `admin/reports/page.tsx`
- [x] 4. App: `SearchBar` (búsqueda por nombre, debounce ya incorporado) en `admin/reports/page.tsx`
- [x] 5. App: Wiring de ambos filtros a `useProfitability` (sin enviar `search: ""`)
- [x] 6. Backend: Unit test de `search` en `reports.service.spec.ts` (solo, combinado con `categoryId`)

## Modo B — Márgenes de catálogo (nuevo, sin backend nuevo)

- [x] 7. App: `useProfitability` acepta `enabled` para no disparar el fetch cuando el modo activo es "catalog"
- [x] 8. App: Toggle "Márgenes de catálogo" (default) / "Ventas reales" en `admin/reports/page.tsx`
- [x] 9. App: `CatalogMarginTable` — reutiliza `useProducts({categoryId, search, isActive: true, page, limit})`, calcula margen client-side (`price - costPrice`), "Sin costo cargado" cuando `costPrice` es `null`
- [x] 10. App: Filtros de categoría/búsqueda compartidos entre ambos modos (no se reinician al cambiar de modo)
- [x] 11. App: Paginación del modo catálogo reutilizando el componente `Pagination` ya existente

## QA / Cierre

- [x] 12. `npm run typecheck` en `api/` y `app/` sin errores
- [x] 13. `npm run test` en `api/` — 86 tests, 83 pasan (3 fallas preexistentes no relacionadas, ya documentadas en el change base)
- [ ] 14. Verificación manual en navegador — **pendiente**, no hay entorno corriendo en esta sesión.
