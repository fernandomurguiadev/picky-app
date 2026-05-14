# Proposal — app-fase-7-pedidos-kanban

## Resumen

Panel de gestión de pedidos en tiempo real: Kanban por status con actualización via WebSocket,
notificación sonora al recibir pedido nuevo, swipe actions en móvil y detalle de pedido con
cambio de estado optimista.

## Motivación

Los comerciantes necesitan ver los pedidos entrantes en tiempo real sin tener que recargar
la página. El Kanban es la interfaz más visual e intuitiva para gestionar el flujo de pedidos.
La notificación sonora es crítica cuando el administrador no está mirando la pantalla.

## Alcance

### Frontend (`app/`)

- `lib/hooks/use-websocket.ts` — conexión socket.io-client al NestJS backend
- `lib/hooks/use-order-notification.ts` — sonido + toast al recibir `order:new`
- `app/(admin)/admin/orders/page.tsx` — Kanban de pedidos
- `components/admin/order-card/index.tsx` — card con swipe actions
- `components/admin/order-detail-dialog/index.tsx` — detalle + cambio de estado

## Endpoint WebSocket

El cliente se conecta **DIRECTO** al NestJS WebSocket (no a través de Next.js):
- URL: `NEXT_PUBLIC_WS_URL` (ej: `wss://api.pickyapp.com`)
- Auth: JWT en handshake `{ auth: { token } }`
- Join room: emit `join-tenant` con `{ tenantId }`
- Eventos recibidos: `order:new`, `order:status-changed`

## Rutas de API consumidas

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/admin/orders` | Listado con filtros |
| PATCH | `/admin/orders/:id/status` | Cambiar estado |
| PATCH | `/admin/orders/:id/notes` | Actualizar notas |

## Notas de implementación

- WebSocket conecta con el `accessToken` del Zustand store (en memoria)
- Reconexión automática: socket.io-client maneja esto nativamente con `reconnection: true`
- Evento `order:new`: invalidar query de TanStack Query para el listado
- Evento `order:status-changed`: invalidar query del pedido específico
- Notificación sonora: requiere interacción previa del usuario (Web Audio API policy)
