# Backend API — NestJS

> Origen: Backend · `api/src/` del monorepo
> Stack: NestJS 10 + TypeORM + PostgreSQL 16

---

## 5.1 Estructura de módulos NestJS

```
src/
├── main.ts
├── app.module.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/ (jwt.strategy.ts, local.strategy.ts)
│   │   └── dto/ (login.dto.ts, register.dto.ts)
│   ├── tenants/
│   │   ├── tenants.module.ts
│   │   ├── tenants.controller.ts
│   │   ├── tenants.service.ts
│   │   └── entities/ (tenant.entity.ts, store-settings.entity.ts)
│   ├── catalog/
│   │   ├── catalog.module.ts
│   │   ├── categories.controller.ts
│   │   ├── products.controller.ts
│   │   ├── catalog.service.ts
│   │   └── entities/ (category.entity.ts, product.entity.ts, option-group.entity.ts)
│   ├── orders/
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   ├── orders.gateway.ts   ← WebSocket Gateway
│   │   └── entities/ (order.entity.ts, order-item.entity.ts)
│   └── upload/
│       ├── upload.module.ts
│       └── upload.service.ts   (Cloudinary / S3)
├── common/
│   ├── decorators/ (tenant-id.decorator.ts, current-user.decorator.ts)
│   ├── guards/ (jwt-auth.guard.ts, tenant.guard.ts)
│   ├── interceptors/ (tenant-context.interceptor.ts)
│   └── filters/ (http-exception.filter.ts)
└── config/ (database.config.ts, jwt.config.ts)
```

---

## 5.2 Endpoint adicional requerido por el middleware de Next.js (NUEVO)

El middleware de Next.js necesita resolver `slug → tenantId` sin cargar toda la configuración del store.

```
GET /stores/:slug/tenant-id → { tenantId: string }
```

Respuesta mínima para máxima velocidad en Edge. Sin autenticación requerida.

---

## 5.3 Endpoints REST del MVP

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | /auth/register | — | Registro. Crea tenant + usuario admin. |
| POST | /auth/login | — | Login. Retorna access_token + seta refresh_token en httpOnly cookie. |
| POST | /auth/refresh | Cookie | Renueva access_token. |
| POST | /auth/logout | JWT | Invalida refresh_token en BD. |
| **GET** | **/stores/:slug/tenant-id** | — | **NUEVO. Solo { tenantId }. Para middleware Next.js.** |
| GET | /stores/:slug | — | Datos públicos del comercio (tienda pública). |
| GET | /stores/:slug/status | — | Estado abierto/cerrado calculado. Sin auth. |
| PATCH | /stores/me | JWT | Actualizar configuración del comercio. |
| GET | /stores/me/settings | JWT | Toda la configuración del comercio. |
| GET | /:slug/categories | — | Categorías activas (tienda pública). |
| GET | /admin/categories | JWT | Categorías (admin, incluye inactivas). |
| POST | /admin/categories | JWT | Crear categoría. |
| PUT | /admin/categories/:id | JWT | Editar categoría. |
| DELETE | /admin/categories/:id | JWT | Eliminar (validar sin productos activos). |
| PATCH | /admin/categories/reorder | JWT | Reordenar. Body: `{ ids: string[] }` |
| GET | /:slug/categories/:id/products | — | Productos activos de categoría (tienda pública). |
| GET | /:slug/products/featured | — | Productos destacados (tienda pública). |
| GET | /:slug/products/search | — | Búsqueda. Query: `q=string`. |
| GET | /admin/products | JWT | Listado con filtros y paginación. |
| GET | /admin/products/:id | JWT | Detalle de producto. |
| POST | /admin/products | JWT | Crear producto con opciones. |
| PUT | /admin/products/:id | JWT | Editar producto completo. |
| PATCH | /admin/products/:id/status | JWT | Toggle activo/inactivo. |
| DELETE | /admin/products/:id | JWT | Eliminar producto. |
| POST | /upload/image | JWT | Upload de imagen → `{ url, publicId }` |
| POST | /orders | — | Crear pedido (tienda pública, sin auth). |
| GET | /admin/orders | JWT | Listado con filtros y paginación. |
| GET | /admin/orders/:id | JWT | Detalle de pedido. |
| PATCH | /admin/orders/:id/status | JWT | Cambiar estado. |
| POST | /admin/orders | JWT | Crear pedido manual. |
| PATCH | /admin/orders/:id/notes | JWT | Actualizar notas internas. |
| GET | /admin/analytics/summary | JWT | Métricas del día/semana/mes. |
| GET | /admin/analytics/hourly | JWT | Pedidos por hora del día. |

---

## 5.4 WebSocket — NestJS Gateway

```typescript
// modules/orders/orders.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  // El cliente Next.js se conecta DIRECTAMENTE a este gateway
  // NO pasa por ningún Route Handler de Next.js
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server

  handleConnection(client: Socket) {
    // Validar JWT del cliente
  }

  handleDisconnect(client: Socket) {
    // Cleanup
  }

  @SubscribeMessage('join-tenant')
  handleJoinTenant(client: Socket, payload: { tenantId: string }) {
    client.join(`tenant:${payload.tenantId}`)
  }

  // Llamado desde OrdersService cuando llega un pedido nuevo
  notifyNewOrder(tenantId: string, order: Order) {
    this.server.to(`tenant:${tenantId}`).emit('order:new', order)
  }

  notifyStatusChanged(tenantId: string, data: { orderId: string; newStatus: string }) {
    this.server.to(`tenant:${tenantId}`).emit('order:status-changed', data)
  }
}
```

**Tabla de eventos WebSocket:**

| Evento | Dirección | Payload | Descripción |
|--------|-----------|---------|-------------|
| `join-tenant` | Client → Server | `{ tenantId: string }` | El admin se une a la sala del tenant. |
| `order:new` | Server → Client | `Order` (completo) | Nuevo pedido. Trigger notificación sonora. |
| `order:status-changed` | Server → Client | `{ orderId, newStatus, changedAt }` | Estado de pedido cambió. |
| `order:cancelled` | Server → Client | `{ orderId, reason? }` | Pedido cancelado. |
| `tenant:store-status` | Server → Client | `{ isOpen: boolean }` | Cambio de estado de la tienda. |

---

## 5.5 Estrategia multi-tenant

```typescript
// Todos los entities tienen tenant_id
@Column({ name: 'tenant_id' })
tenantId: string

// TenantContextInterceptor extrae tenantId del JWT y lo adjunta al request
// Todos los servicios filtran por tenantId automáticamente:
async getCategories(tenantId: string): Promise<Category[]> {
  return this.categoryRepo.find({
    where: { tenantId, isActive: true },
    order: { order: 'ASC' }
  })
}

// Tienda pública: tenantId se resuelve desde el slug vía middleware de Next.js
// Ver 01-arquitectura-frontend.md § 2.5 — el header x-tenant-id se inyecta en el Edge
```
