# Planificación Backend — NestJS API
## Plataforma E-Commerce de Proximidad · MVP

> **Stack:** NestJS 10 · TypeORM · PostgreSQL 16 · Socket.io · JWT (RS256)
> **Directorio de trabajo:** `api/`
> **Referencia técnica:** [03-backend-api.md](./03-backend-api.md)
> **Convenciones:** ver [arquitectura.md](../specs/architecture.md) y [conventions.md](../specs/api/conventions.md)

---

## Estado actual

| Item | Estado |
|------|--------|
| Proyecto NestJS inicializado | ✅ Scaffolded (esqueleto base) |
| Módulos de dominio | ❌ Por implementar |
| Base de datos / migraciones | ❌ Por implementar |
| Docker configurado | ❌ Por implementar |

---

## Fases de implementación

### FASE 0 — Setup e infraestructura base

**Objetivo:** Proyecto levantado con Docker, TypeScript strict y configuración de entorno.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| B0.1 | Configurar `tsconfig.json` con strict mode completo | `tsconfig.json`, `tsconfig.build.json` | `npm run typecheck` sin errores |
| B0.2 | Crear `docker-compose.yml` con servicio PostgreSQL 16 | `docker-compose.yml` | `docker-compose up` levanta PostgreSQL en puerto 5432 |
| B0.3 | Configurar TypeORM con `synchronize: false`, pool de conexiones, y separar `database.config.ts` | `src/config/database.config.ts` | `npm run start:dev` conecta a PG sin errores |
| B0.4 | Configurar variables de entorno con `@nestjs/config` + validación con Zod/Joi | `src/config/env.config.ts`, `.env.example` | App falla si falta variable requerida |
| B0.5 | Configurar módulo global `common/` con filtros, interceptors, decorators base | `src/common/` | Estructura de carpetas según spec [03-backend-api.md §5.1](./03-backend-api.md) |
| B0.6 | Configurar `HttpExceptionFilter` global para envelope de errores | `src/common/filters/http-exception.filter.ts` | Error 404 retorna `{ error: { code, message } }` |
| B0.7 | Configurar `TransformInterceptor` para envelope de respuestas exitosas | `src/common/interceptors/transform.interceptor.ts` | GET endpoint retorna `{ data: ..., meta: ... }` |

---

### FASE 1 — Autenticación y entidades base

**Objetivo:** Auth completo (registro, login, JWT, refresh) + todas las entidades TypeORM con sus migraciones.

#### F1-A: Entidades TypeORM + Migraciones

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| B1.1 | Crear entidad `Tenant` con campos: `id`, `slug` (único), `name`, `isActive`, `createdAt` | `src/modules/tenants/entities/tenant.entity.ts` | Migración genera tabla `tenants` |
| B1.2 | Crear entidad `User` con FK a `tenant_id`, campos: `email`, `passwordHash`, `role`, `refreshToken` | `src/modules/auth/entities/user.entity.ts` | Migración genera tabla `users` con índice en `(tenant_id, email)` |
| B1.3 | Crear entidad `StoreSettings` con FK a `tenant_id`, schema `DaySchedule` como JSONB, campos de tema (colores), entrega, pagos | `src/modules/tenants/entities/store-settings.entity.ts` | Migración genera tabla `store_settings` |
| B1.4 | Crear entidad `Category` con `tenant_id` primer campo índice compuesto, `order`, `isActive` | `src/modules/catalog/entities/category.entity.ts` | Migración genera tabla `categories` con índice `(tenant_id, order)` |
| B1.5 | Crear entidad `Product` con FK a `category_id` y `tenant_id`, campos: `price` (integer, centavos), `isFeatured`, `isActive` | `src/modules/catalog/entities/product.entity.ts` | `price` es `int` nunca `decimal/float` |
| B1.6 | Crear entidades `OptionGroup` y `OptionItem` con FK a `product_id` | `src/modules/catalog/entities/option-group.entity.ts` | Migración genera tablas con FK correctas |
| B1.7 | Crear entidad `Order` con `tenant_id`, `status` enum, `deliveryMethod`, `paymentMethod`, campos de totales en centavos | `src/modules/orders/entities/order.entity.ts` | Migración genera tabla `orders` |
| B1.8 | Crear entidad `OrderItem` con FK a `order_id`, `productId`, `selectedOptions` JSONB, `unitPrice` integer | `src/modules/orders/entities/order-item.entity.ts` | Migración genera tabla `order_items` |
| B1.9 | **Generar y verificar todas las migraciones** | — | `npm run migration:generate -- --name=InitialSchema` · Ejecuta sin errores |

> ⚠️ **No crear migraciones manualmente.** Avisar al desarrollador para ejecutar `npm run migration:generate -- --name=<Nombre>`.

#### F1-B: Módulo Auth

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| B1.10 | Implementar `POST /auth/register`: crea Tenant + User admin, hashea password con bcrypt (cost 12), retorna access_token | `auth.controller.ts`, `auth.service.ts` | Registro crea 2 registros en BD. Password no se guarda en plain text. |
| B1.11 | Implementar `POST /auth/login`: valida credenciales, emite JWT access (15min) + seta refresh token (7d) en httpOnly cookie | `auth.service.ts`, `jwt.config.ts` | Login retorna `{ access_token }`. Cookie `refresh-token` seteada. |
| B1.12 | Configurar JWT con RS256: claves desde variables de entorno (Vault KV-v2 en producción) | `src/config/jwt.config.ts` | Token decodificado muestra `alg: RS256` |
| B1.13 | Implementar `POST /auth/refresh`: valida refresh token de cookie, emite nuevo access token | `auth.controller.ts` | Token expirado + cookie válida → nuevo access token |
| B1.14 | Implementar `POST /auth/logout`: invalida refresh token en BD, limpia cookie | `auth.service.ts` | Logout borra `refreshToken` en User. Cookie eliminada. |
| B1.15 | Implementar `POST /auth/forgot-password` y `POST /auth/reset-password` | `auth.service.ts` | Email enviado con token de reset. Token de un solo uso. |
| B1.16 | Crear `JwtAuthGuard`, `RolesGuard` y `TenantContextGuard` | `src/common/guards/` | Endpoint protegido retorna 401 sin token, 403 sin rol correcto |
| B1.17 | Crear `TenantContextInterceptor`: extrae `tenantId` del JWT y lo inyecta en el request | `src/common/interceptors/tenant-context.interceptor.ts` | `@TenantId()` decorator funciona en controllers |

---

### FASE 2 — Módulo Catálogo

**Objetivo:** CRUD completo de categorías y productos con opciones. Multi-tenant con RLS via `tenant_id`.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| B2.1 | `GET /:slug/categories` — público, solo categorías activas | `catalog.service.ts` | Sin auth. Filtra por `tenant_id` + `isActive: true` |
| B2.2 | `GET /admin/categories` — admin, incluye inactivas | `categories.controller.ts` | Requiere JWT. Filtra por `tenantId` del token. |
| B2.3 | `POST /admin/categories` con DTO validado (nombre, imagen, estado) | `create-category.dto.ts` | Validación retorna 400 con `errors[]` detallados |
| B2.4 | `PUT /admin/categories/:id` — verificar ownership antes de actualizar | `catalog.service.ts` | 403 si el `category.tenantId` no coincide con el token |
| B2.5 | `DELETE /admin/categories/:id` — bloquear si tiene productos activos | `catalog.service.ts` | BusinessException si existen productos activos |
| B2.6 | `PATCH /admin/categories/reorder` — recibe `{ ids: string[] }`, actualiza campo `order` en batch | `catalog.service.ts` | Transacción atómica. Falla si algún ID no pertenece al tenant. |
| B2.7 | `GET /:slug/categories/:id/products` — público, productos activos de una categoría con paginación | `products.controller.ts` | Retorna `{ data: Product[], meta: { page, total, limit } }` |
| B2.8 | `GET /:slug/products/featured` — público, productos con `isFeatured: true` | `products.controller.ts` | Sin auth, max 10 resultados |
| B2.9 | `GET /:slug/products/search` — público, búsqueda por `q=` con `ILIKE` en nombre/descripción | `products.controller.ts` | Debounce no aplica en backend — query directa con `ILIKE '%q%'` |
| B2.10 | `GET /admin/products` — admin, listado con filtros (categoría, estado) y paginación server-side | `products.controller.ts` | Paginación: `page`, `limit`, retorna `meta.total` |
| B2.11 | `POST /admin/products` — crear producto con opciones anidadas (upsert de OptionGroup + OptionItem) | `catalog.service.ts` | Producto creado con groups/items en transacción |
| B2.12 | `PUT /admin/products/:id` — editar producto completo, reemplazar groups/items | `catalog.service.ts` | Transacción: delete old groups → insert new groups |
| B2.13 | `PATCH /admin/products/:id/status` — toggle activo/inactivo | `catalog.service.ts` | Optimistic-safe: retorna el estado actualizado |
| B2.14 | `DELETE /admin/products/:id` — soft delete o hard delete según config | `catalog.service.ts` | Verificar ownership. No eliminar si tiene orders activas. |

---

### FASE 3 — Módulo Tenants / Configuración de Tienda

**Objetivo:** Endpoints de configuración de tienda (info, horarios, entrega, pagos, tema) + endpoint crítico del middleware.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| B3.1 | `GET /stores/:slug/tenant-id` — **sin auth**, respuesta mínima `{ tenantId }` | `tenants.controller.ts` | Response time < 50ms. Sin joins. |
| B3.2 | `GET /stores/:slug` — datos públicos del comercio para tienda pública | `tenants.service.ts` | Retorna nombre, logo, tema, estado abierto/cerrado |
| B3.3 | `GET /stores/:slug/status` — estado abierto/cerrado calculado en base a `DaySchedule` | `tenants.service.ts` | Calcula correctamente con timezone del tenant |
| B3.4 | `GET /stores/me/settings` — toda la configuración del comercio autenticado | `tenants.controller.ts` | Requiere JWT. Retorna `StoreSettings` completo |
| B3.5 | `PATCH /stores/me` — actualizar configuración (cualquier sección: info, horarios, entrega, pagos, tema) | `tenants.service.ts` | Actualización parcial con `DeepPartial`. Valida `DaySchedule` schema. |
| B3.6 | Validar schema `DaySchedule` en el DTO con class-validator custom | `update-store-settings.dto.ts` | Turnos sin overlap. Hours en formato HH:mm. |

---

### FASE 4 — Módulo Upload

**Objetivo:** Upload de imágenes a Cloudinary/S3 con validación de tipo y tamaño.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| B4.1 | `POST /upload/image` — recibe multipart, valida tipo (jpg/png/webp) y tamaño (max 5MB) | `upload.controller.ts`, `upload.service.ts` | 400 si tipo inválido. 413 si supera límite. |
| B4.2 | Integrar con Cloudinary SDK o AWS S3 según variable de entorno `STORAGE_PROVIDER` | `upload.service.ts` | Retorna `{ url, publicId }`. URL con CDN. |
| B4.3 | Validar que solo el tenant dueño puede subir al folder correspondiente | `upload.service.ts` | Upload va a folder `tenants/{tenantId}/` |

---

### FASE 5 — Módulo Órdenes (REST)

**Objetivo:** Creación de pedidos desde tienda pública + gestión desde admin.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| B5.1 | `POST /orders` — sin auth, crea pedido desde tienda pública | `orders.controller.ts`, `orders.service.ts` | Pedido creado con status `PENDING`. Valida monto mínimo si configurado. |
| B5.2 | `GET /admin/orders` — listado con filtros (status, fecha) y paginación | `orders.controller.ts` | Filtra por `tenantId` del JWT. |
| B5.3 | `GET /admin/orders/:id` — detalle completo con items y opciones seleccionadas | `orders.service.ts` | Retorna `Order` con `items[].selectedOptions` expandido |
| B5.4 | `PATCH /admin/orders/:id/status` — cambiar estado con validación de transiciones | `orders.service.ts` | Solo transiciones válidas: `PENDING→CONFIRMED→PREPARING→READY→DELIVERED` |
| B5.5 | `POST /admin/orders` — crear pedido manual desde admin | `orders.controller.ts` | Requiere JWT. Genera número de orden. |
| B5.6 | `PATCH /admin/orders/:id/notes` — actualizar notas internas | `orders.service.ts` | Solo actualiza campo `internalNotes`. |
| B5.7 | Al crear/actualizar pedido, emitir evento WebSocket al room del tenant | `orders.service.ts` → llama `OrdersGateway` | Evento `order:new` / `order:status-changed` emitido |

---

### FASE 6 — WebSocket Gateway

**Objetivo:** Gateway de Socket.io para pedidos en tiempo real. Cliente Next.js se conecta DIRECTAMENTE a NestJS.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| B6.1 | Crear `OrdersGateway` con `@WebSocketGateway` configurado para CORS desde `FRONTEND_URL` | `src/modules/orders/orders.gateway.ts` | wscat puede conectar al gateway |
| B6.2 | Implementar `handleConnection`: validar JWT del cliente en handshake | `orders.gateway.ts` | Conexión sin JWT → desconectar inmediatamente |
| B6.3 | Implementar handler `join-tenant`: client se une al room `tenant:{tenantId}` | `orders.gateway.ts` | `socket.join('tenant:abc123')` funciona |
| B6.4 | Implementar `notifyNewOrder(tenantId, order)`: emite `order:new` al room | `orders.gateway.ts` | Evento emitido solo al room del tenant correcto |
| B6.5 | Implementar `notifyStatusChanged(tenantId, data)`: emite `order:status-changed` | `orders.gateway.ts` | Evento incluye `{ orderId, newStatus }` |
| B6.6 | Inyectar `OrdersGateway` en `OrdersService` para emitir eventos desde la lógica | `orders.module.ts` | `OrdersService` emite evento inmediatamente al crear/actualizar orden |

---

### FASE 7 — Analytics

**Objetivo:** Métricas para el dashboard del admin.

| # | Tarea | Archivos clave | Criterio de done |
|---|-------|---------------|-----------------|
| B7.1 | `GET /admin/analytics/summary` — métricas del día/semana/mes: total pedidos, ingresos, ticket promedio, status breakdown | `analytics.controller.ts`, `analytics.service.ts` | Query agrupada por `tenantId`. Centavos en respuesta. |
| B7.2 | `GET /admin/analytics/hourly` — distribución de pedidos por hora del día (para gráfico) | `analytics.service.ts` | Array de 24 horas con conteos |

---

### FASE 8 — QA y Hardening

**Objetivo:** Revisión de seguridad, performance y calidad antes de demo.

| # | Tarea | Criterio de done |
|---|-------|-----------------|
| B8.1 | Audit de seguridad: verificar que ningún endpoint filtra datos de otros tenants | Prueba manual con 2 tenants distintos: ninguno puede leer datos del otro |
| B8.2 | Verificar que todos los montos monetarios son `integer` (centavos) | Búsqueda en código: ningún campo `price` usa `float`/`decimal` |
| B8.3 | Rate limiting en endpoints de auth | `POST /auth/login` → 10 req/min por IP. 429 si supera. |
| B8.4 | Ejecutar `npm run typecheck` sin errores | 0 errores TypeScript |
| B8.5 | Revisar que `synchronize: false` en toda la config TypeORM | Búsqueda en código: `synchronize: false` en todos los configs |
| B8.6 | Test de carga WebSocket: 10 clientes concurrentes en el mismo tenant | Todos reciben el evento `order:new` en < 100ms |

---

## Dependencias entre fases

```
F0 → F1-A → F1-B → F2 → F3 → F5 → F6 → F7 → F8
                      ↗
              F4 (Upload, puede ser paralelo desde F1-A)
```

---

## Checklist de seguridad pre-entrega

- [ ] JWT: algoritmo RS256, no HS256
- [ ] Refresh token: httpOnly cookie, `SameSite=Strict`, `Secure=true`
- [ ] `tenant_id` como primer campo en todos los índices compuestos multi-tenant
- [ ] Toda entidad multi-tenant valida ownership antes de operar
- [ ] Passwords hasheados con bcrypt cost >= 12
- [ ] Upload: validar tipo MIME server-side (no confiar en extensión del archivo)
- [ ] Rate limiting en endpoints de auth
- [ ] `synchronize: false` en TypeORM
- [ ] Variables sensibles en variables de entorno, nunca hardcodeadas
- [ ] Ningún `throw new Error()` suelto — usar `BusinessException`

---

## Comandos de referencia

```bash
# Levantar API en desarrollo
cd api && npm run start:dev

# TypeCheck
cd api && npm run typecheck

# Generar migración (ejecutar después de modificar entidades)
cd api && npm run migration:generate -- --name=<NombreDeLaMigracion>

# Ejecutar migraciones
cd api && npm run migration:run
```

---

## Referencias cruzadas

| Documento | Contenido |
|-----------|-----------|
| [03-backend-api.md](./03-backend-api.md) | Estructura de módulos, todos los endpoints, WebSocket Gateway |
| [00-contexto-producto.md](./00-contexto-producto.md) | Decisiones de arquitectura y por qué |
| [modulos/mod-01-catalogo.md](./modulos/mod-01-catalogo.md) | Interfaces TypeScript de Catálogo |
| [modulos/mod-03-pedidos.md](./modulos/mod-03-pedidos.md) | Tipos de Order, OrderStatus, OrderItem |
| [modulos/mod-04-configuracion.md](./modulos/mod-04-configuracion.md) | Schema DaySchedule, StoreSettings |
| [modulos/mod-06-autenticacion.md](./modulos/mod-06-autenticacion.md) | Flujo JWT + Refresh Token |
| [05-criterios-aceptacion.md](./05-criterios-aceptacion.md) | Criterios CA-001 a CA-018 |
| [openspec/specs/api/conventions.md](../specs/api/conventions.md) | Convenciones de endpoints, envelope |
| [openspec/specs/data/database.md](../specs/data/database.md) | Convenciones de BD, migraciones |
| [openspec/specs/security/security-overview.md](../specs/security/security-overview.md) | Reglas de seguridad |
