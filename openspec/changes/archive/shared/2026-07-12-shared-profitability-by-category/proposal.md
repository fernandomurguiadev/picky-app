# Proposal: Dos Modos de Rentabilidad — Ventas Reales y Márgenes de Catálogo

## Intent

El panel de Rentabilidad (`admin/reports`, del change `2026-07-12-shared-purchase-cost-profitability`, ya archivado) hoy responde una sola pregunta: **"¿cuánto gané con lo que ya vendí?"** — solo muestra productos con al menos una venta confirmada en el período. El comerciante también necesita responder una segunda pregunta, independiente de si algo se vendió o no: **"¿qué margen tiene cada producto de mi catálogo?"**. Se agregan dos modos al mismo panel, más filtros de categoría/búsqueda en ambos.

## Problema Actual

- `ReportsService.aggregateByProduct` arranca la query desde `order_items` (`INNER JOIN` a `orders`) — un producto sin ventas en el período **no aparece en absoluto** en `byProduct`, ni siquiera con $0. Esto es correcto para "rentabilidad de ventas reales", pero no sirve para responder "¿cuál es el margen configurado de este producto, se haya vendido o no?".
- El frontend (`app/src/app/(admin)/admin/reports/page.tsx`) no expone filtros de categoría/búsqueda (ver spec ya redactada), y tampoco tiene forma de ver el catálogo completo con su margen.
- `GET /admin/products` (`ProductsQueryDto`: `categoryId`, `search` ILIKE, `isActive`, paginado) **ya devuelve `price` y `costPrice`** para el rol `ADMIN` (vía el class-serializer por rol del change base) — toda la data para el segundo modo ya está disponible sin tocar el backend.

## Solución — Dos Modos en el mismo panel

Un toggle "Márgenes de catálogo" / "Ventas reales" arriba de la tabla — **"Márgenes de catálogo" es el modo por defecto** al entrar al panel (responde la pregunta más fundamental, independiente de si algo se vendió). Mismos filtros de categoría/búsqueda en ambos modos; el navegador de mes solo aplica al modo "Ventas reales".

### Modo A — "Ventas reales" (ya implementado, se le suman filtros)

- Basado en pedidos confirmados del período (`ReportsService.getProfitability`, sin cambios de fondo).
- Filtros nuevos: `search` (ILIKE sobre `oi.productName`) + `categoryId` (ya soportado) expuestos en la UI vía `SearchBar` + `Select`/`useCategories()`.
- Semántica sin cambios: solo aparecen productos con ventas en el período — se documenta explícitamente para que quede claro que esto es intencional, no un bug.

### Modo B — "Márgenes de catálogo" (nuevo)

- Basado en el catálogo completo, **sin período** (no depende de ventas ni de fechas — es el margen configurado *ahora*).
- Reutiliza `useProducts({ categoryId, search, isActive: true })` (hook ya existente, mismo endpoint que usa `admin/catalog/products`) — **sin endpoint nuevo**.
- Por cada producto: `price`, `costPrice`, margen unitario = `price - costPrice` (si `costPrice` es `null`, se muestra "sin costo cargado" en vez de un margen falso), `marginPercent = margen / price * 100`.
- Mismos filtros de categoría/búsqueda que el Modo A, reutilizando los mismos controles de UI (no se duplican).
- Paginado igual que `admin/catalog/products` (reutiliza el componente `Pagination` ya existente).

## Impacto en Multi-tenancy

- Modo A: sin cambios respecto al change base.
- Modo B: reutiliza `GET /admin/products`, que ya filtra por `tenantId` vía el mecanismo existente de RLS/tenant scoping del módulo `catalog` — no se introduce ninguna superficie nueva.

## Out of Scope

- Exportación CSV/PDF (change futuro, charlado por separado).
- Reportes de ventas históricas / mermas / inventario (explorados en la misma conversación, quedan como changes futuros independientes).
- Costo a nivel de opción/variante (limitación conocida, documentada en el change base) — el Modo B tampoco lo resuelve, muestra el margen a nivel producto base.

## Target Area

- **Admin — Rentabilidad**: toggle de dos modos + filtros de categoría/búsqueda compartidos.
- **API**: solo cambios en `ProfitabilityQueryDto`/`ReportsService` (Modo A) — Modo B no requiere backend nuevo.
