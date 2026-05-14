# Tasks — app-fase-7-pedidos-kanban

## Fase de implementación: FASE 7 — Admin: Gestión de Pedidos (Kanban + WebSocket)

**Prerequisito:** FASE 6 completada. Backend FASE 6 (WebSocket Gateway) completado.

---

### FE7.1 — Hook `useWebSocket`

- [x] Crear `lib/hooks/use-websocket.ts`
- [x] Conectar `socket.io-client` a `NEXT_PUBLIC_WS_URL` con `{ auth: { token: accessToken } }`
- [x] `reconnection: true`, `reconnectionDelay: 1000`, `reconnectionAttempts: 5`
- [x] Listener `connect`: emitir `join-tenant` con `{ tenantId }`
- [x] Log en consola al conectar/desconectar (para debugging)
- [x] Cleanup: `socket.disconnect()` en el return del `useEffect`

**Criterio de done:** Conexión establecida. Console log visible al conectar.

---

### FE7.2 — Reconexión automática y `join-tenant`

- [x] Listener `disconnect`: log de aviso
- [x] Listener `reconnect`: re-emitir `join-tenant` (socket.io lo hace en `connect`, verificar)
- [x] Listener `session-expired`: redirect a `/auth/login`

**Criterio de done:** Desconexión → reconecta automáticamente y re-une al room del tenant.

---

### FE7.3 — Hook `useOrderNotification`

- [x] Crear `lib/hooks/use-order-notification.ts`
- [x] Detectar primera interacción del usuario (`click`) con `useRef`
- [x] `playNotificationSound()` con Web Audio API (solo si hubo interacción)
- [x] `notifyNewOrder(orderNumber)`: sonido + `toast.success` con duración 8s

**Criterio de done:** Sonido solo si hubo interacción previa. Sin crash si AudioContext falla.

---

### FE7.4 — `OrdersKanban`

- [x] Crear `app/(admin)/admin/orders/page.tsx`
- [x] Hook `useAdminOrders` con TanStack Query
- [x] Llamar `useWebSocket(tenantId)` en esta página
- [x] Listener `order:new` en `useWebSocket`: `qc.invalidateQueries(ordersKeys.admin())` + `notifyNewOrder`
- [x] 5 columnas: PENDING, CONFIRMED, PREPARING, READY, DELIVERED
- [x] Scroll horizontal en móvil (`overflow-x-auto`)
- [x] Indicador de carga con `SkeletonLoader` (Skeleton ui)

**Criterio de done:** Nuevo pedido desde la tienda aparece en columna PENDING sin reload.

---

### FE7.5 — `OrderCard` con swipe actions

- [x] Crear `components/admin/order-card/index.tsx`
- [x] Info resumida: número de pedido, hora, total, método de entrega
- [x] Badge de status usando `Badge` (shared)
- [x] Click → abre `OrderDetailDialog`
- [x] Swipe derecha (móvil) → confirmar/avanzar al siguiente estado
- [x] Swipe izquierda (móvil) → cancelar (con confirmación)

**Criterio de done:** Swipe acciones funcionan en touch. Click abre el detalle.

---

### FE7.6 — `OrderDetailDialog`

- [x] Crear `components/admin/order-detail-dialog/index.tsx`
- [x] Detalle completo: items, opciones seleccionadas, datos del cliente, método de entrega/pago
- [x] Select para cambiar status con transiciones válidas únicamente
- [x] Textarea para notas internas (`PATCH /admin/orders/:id/notes`)
- [x] Cambio de estado: optimistic update en el kanban

**Criterio de done:** Cambiar estado hace optimistic update. El kanban refleja el cambio inmediatamente.

---

### FE7.7 — Invalidación de cache por WebSocket

- [x] Listener `order:status-changed` en `useWebSocket`: invalidar query del pedido específico + listado general
- [x] Verificar que el kanban se actualiza sin reload completo

**Criterio de done:** Cache invalidada al recibir evento → kanban re-fetcha el pedido actualizado.

---

### Verificación final

- [x] `npm run typecheck` — sin errores
- [x] Probar flujo completo: crear pedido en tienda pública → aparece en kanban admin en < 500ms
- [x] Verificar en Network tab que el WebSocket conecta a `NEXT_PUBLIC_WS_URL` (no a `/api/`)
