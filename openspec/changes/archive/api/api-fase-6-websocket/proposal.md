# Proposal — api-fase-6-websocket

## Resumen

Gateway de Socket.io para notificaciones en tiempo real del panel admin.
Cuando se crea o cambia el estado de un pedido, el servidor emite un evento
al room del tenant correspondiente. El frontend Next.js se conecta directamente
a NestJS (sin intermediarios).

## Motivación

El kanban de pedidos en el panel admin requiere actualización en tiempo real
sin polling. Socket.io con rooms por tenant garantiza aislación multi-tenant:
un tenant nunca recibe eventos de otro.

## Alcance

### Backend (`api/`)

- `modules/orders/orders.gateway.ts` — `@WebSocketGateway` con CORS y autenticación JWT en handshake
- `modules/orders/orders.module.ts` — agregar `OrdersGateway` a providers
- `modules/orders/orders.service.ts` — inyectar `OrdersGateway` y emitir eventos en `createOrder` y `updateOrderStatus`

## Autenticación del WebSocket

El cliente envía el JWT en el handshake:
```javascript
io(WS_URL, { auth: { token: accessToken } })
```

El gateway extrae `auth.token`, lo verifica con `JwtService.verify()` usando la clave pública RS256.
Si el token es inválido o está ausente → `client.disconnect()` inmediato.

## Rooms

Cada tenant tiene su room: `tenant:{tenantId}`.
El cliente envía el evento `join-tenant` y el servidor hace `client.join('tenant:{tenantId}')`.
Solo se permite unirse al room del propio tenant (validado contra el JWT del handshake).

## Eventos emitidos

| Evento | Payload | Cuándo |
|--------|---------|--------|
| `order:new` | `Order` completo | Al crear un pedido |
| `order:status-changed` | `{ orderId, newStatus, statusHistory }` | Al cambiar estado |

## Variables de entorno necesarias

```
FRONTEND_URL=http://localhost:3000   # para CORS del WebSocket
```

## Criterios de aceptación

- Conectar sin JWT → desconexión inmediata
- Conectar con JWT expirado → desconexión inmediata
- `POST /orders` → el admin panel recibe evento `order:new` si está conectado al room del tenant
- `PATCH /admin/orders/:id/status` → admin panel recibe `order:status-changed`
- Un tenant no puede unirse al room de otro tenant
