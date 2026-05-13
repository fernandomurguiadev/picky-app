# Design — api-fase-6-websocket

## Estructura de archivos resultante

```
api/
└── src/
    └── modules/
        └── orders/
            ├── orders.gateway.ts    ← NUEVO
            ├── orders.module.ts     ← MODIFICAR (agregar OrdersGateway)
            └── orders.service.ts    ← MODIFICAR (inyectar y usar OrdersGateway)
```

---

## Dependencias a instalar

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

---

## `orders.gateway.ts`

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: (origin, cb) => cb(null, origin) }, // FRONTEND_URL validado en handleConnection
  namespace: '/',
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify(token, {
        algorithms: ['RS256'],
      });
      // Guardar tenantId en el socket para validar rooms
      (client as any).tenantId = payload.tenantId as string;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket): void {
    // cleanup automático gestionado por Socket.io
  }

  @SubscribeMessage('join-tenant')
  handleJoinTenant(
    @MessageBody() data: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const socketTenantId = (client as any).tenantId as string;
    // Solo permite unirse al room del propio tenant
    if (!socketTenantId || socketTenantId !== data.tenantId) {
      client.disconnect();
      return;
    }
    void client.join(`tenant:${data.tenantId}`);
  }

  emitOrderNew(tenantId: string, order: unknown): void {
    this.server.to(`tenant:${tenantId}`).emit('order:new', order);
  }

  emitOrderStatusChanged(
    tenantId: string,
    payload: { orderId: string; newStatus: string; statusHistory: unknown[] },
  ): void {
    this.server.to(`tenant:${tenantId}`).emit('order:status-changed', payload);
  }
}
```

---

## Cambios en `orders.service.ts`

```typescript
// Constructor — agregar OrdersGateway como dependencia opcional
constructor(
  // ... repos existentes
  private readonly ordersGateway: OrdersGateway,
) {}

// En createOrder() — al finalizar la transacción:
this.ordersGateway.emitOrderNew(order.tenantId, order);

// En updateOrderStatus() — al persistir el cambio:
this.ordersGateway.emitOrderStatusChanged(order.tenantId, {
  orderId: order.id,
  newStatus: dto.status,
  statusHistory: order.statusHistory,
});
```

---

## Cambios en `orders.module.ts`

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, StoreSettings]),
    JwtModule.registerAsync({ /* igual que AuthModule */ }),
  ],
  providers: [OrdersService, OrdersGateway],
  controllers: [StorefrontOrdersController, AdminOrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
```

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `FRONTEND_URL` | Origen permitido para CORS del WebSocket (ej. `http://localhost:3000`) |

---

## Eventos emitidos

| Evento | Room destino | Payload |
|--------|-------------|---------|
| `order:new` | `tenant:{tenantId}` | Objeto `Order` completo |
| `order:status-changed` | `tenant:{tenantId}` | `{ orderId, newStatus, statusHistory }` |
