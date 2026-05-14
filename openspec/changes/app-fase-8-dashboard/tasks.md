# Tasks — app-fase-8-dashboard

## Fase de implementación: FASE 8 — Admin: Dashboard y funcionalidades complementarias

**Prerequisito:** FASE 7 completada.

---

### FE8.1 — `DashboardPage` — layout adaptativo

- [x] Crear `app/(admin)/admin/dashboard/page.tsx`
- [x] En móvil: solo grilla de 4 cards con métricas
- [x] En desktop: cards + gráfico de barras por hora
- [x] Selector de período: hoy / esta semana / este mes
- [x] Estado de carga: `SkeletonLoader` mientras llegan los datos

**Criterio de done:** Desktop muestra gráfico. Móvil muestra solo cards.

---

### FE8.2 — `MetricCard`

- [x] Crear `components/admin/metric-card/index.tsx`
- [x] Props: `label`, `value`, `icon`, `trend? { value, isPositive }`, `subtext?`
- [x] Trend muestra variación % vs período anterior
- [x] 4 métricas: pedidos del período, ingresos (formateados), ticket promedio, pedidos pendientes

**Criterio de done:** 4 cards con datos reales del backend. Precios formateados en ARS.

---

### FE8.3 — Toggle abierto/cerrado

- [x] Switch en el dashboard que llama `PATCH /stores/me { isOpen: !current }`
- [x] Estado sincronizado con `useStoreSettings`
- [x] Badge `StoreStatusBadge` junto al switch
- [x] Optimistic update: cambiar switch inmediatamente, revertir si falla

**Criterio de done:** Toggle actualiza UI inmediatamente. Estado persiste en el backend.

---

### FE8.4 — Buscador de productos (reusar de FASE 2)

- [x] Verificar que el `SearchBar` de FASE 2 funciona en el contexto del admin
- [x] No es necesario crear nada nuevo — tarea de verificación

**Criterio de done:** Buscador en `/admin/catalog/products` funciona con debounce.

---

### FE8.5 — Onboarding wizard

- [x] Crear `app/(admin)/admin/onboarding/page.tsx`
- [x] 4 pasos: nombre+logo, primera categoría, primer producto, horarios (opcional)
- [x] Indicador de progreso visual (barra o steps)
- [x] Cada paso llama a la API correspondiente antes de avanzar
- [x] Paso de horarios tiene botón "Saltear por ahora"
- [x] Al completar: redirect a `/admin/dashboard`
- [x] En el middleware/dashboard: si el comercio no tiene nombre ni producto → redirect al wizard

**Criterio de done:** Nuevo usuario ve el wizard. Completarlo configura la tienda básica.

---

### Verificación final

- [x] `npm run typecheck` — sin errores
- [x] `npm run lint` — sin errores
- [x] Probar en 360px: dashboard completamente funcional
