# Tasks — api-fase-6-websocket

## Fase de implementación: FASE 6 — WebSocket Gateway

---

### B6.0 — Instalar dependencias

- [ ] Ejecutar en `api/`: `npm install @nestjs/websockets @nestjs/platform-socket.io socket.io`

**Criterio de done:** `import { WebSocketGateway } from '@nestjs/websockets'` compila sin errores.

---

### B6.1 — Variable de entorno

- [ ] Agregar `FRONTEND_URL` a `api/src/config/env.config.ts` como `z.string().url()`
- [ ] Agregar `FRONTEND_URL=http://localhost:3000` al archivo `.env.example`

**Criterio de done:** App falla al iniciar si `FRONTEND_URL` no es una URL válida.

---

### B6.2 — `OrdersGateway`

- [ ] Crear `api/src/modules/orders/orders.gateway.ts`
- [ ] `@WebSocketGateway` con CORS permisivo en `handleConnection` (validar contra `FRONTEND_URL`)
- [ ] Implementar `OnGatewayConnection`:
  - Extraer `client.handshake.auth.token`
  - Si no existe → `client.disconnect()` inmediato
  - `jwtService.verify(token, { algorithms: ['RS256'] })` → extraer `tenantId` del payload
  - Si el token es inválido o expirado → `client.disconnect()` inmediato
  - Guardar `tenantId` en la instancia del socket para validación posterior
- [ ] Implementar `OnGatewayDisconnect` (no requiere lógica adicional)
- [ ] Handler `@SubscribeMessage('join-tenant')`:
  - Comparar `data.tenantId` con el `tenantId` guardado en el socket
  - Si no coinciden → `client.disconnect()`
  - Si coinciden → `client.join('tenant:{tenantId}')`
- [ ] Método `emitOrderNew(tenantId, order)` → emite `order:new` al room `tenant:{tenantId}`
- [ ] Método `emitOrderStatusChanged(tenantId, payload)` → emite `order:status-changed` al room `tenant:{tenantId}`

**Criterio de done:** Conectar sin JWT → desconexión inmediata. Conectar con JWT válido de otro tenant e intentar `join-tenant` con tenantId ajeno → desconexión inmediata.

---

### B6.3 — Modificar `OrdersService`

- [ ] Inyectar `OrdersGateway` en el constructor de `OrdersService`
- [ ] Al final de `createOrder()`, después de persistir la transacción:
  `this.ordersGateway.emitOrderNew(order.tenantId, order)`
- [ ] Al final de `updateOrderStatus()`, después de guardar:
  `this.ordersGateway.emitOrderStatusChanged(order.tenantId, { orderId, newStatus, statusHistory })`

**Criterio de done:** `POST /orders` exitoso emite `order:new` al room del tenant. `PATCH /admin/orders/:id/status` exitoso emite `order:status-changed`.

---

### B6.4 — Modificar `OrdersModule`

- [ ] Importar `JwtModule.registerAsync(...)` (clave pública RS256) en `OrdersModule`
- [ ] Agregar `OrdersGateway` a la lista de `providers`

**Criterio de done:** `npm run typecheck` sin errores. `OrdersGateway` inyectable en `OrdersService`.

---

### B6.5 — Verificación final

- [ ] `npm run typecheck` sin errores en `api/`
- [ ] Conexión con JWT válido → cliente se une al room y recibe eventos `order:new` y `order:status-changed`
- [ ] Conexión con JWT expirado → desconexión inmediata (sin crash del servidor)

**Criterio de done:** Los tres criterios pasan manualmente con un cliente Socket.io de prueba.
