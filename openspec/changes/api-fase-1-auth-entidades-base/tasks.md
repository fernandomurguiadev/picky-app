# Tasks — api-fase-1-auth-entidades-base

## Fase de implementación: FASE 1 — Autenticación y Entidades Base

---

## F1-A: Entidades TypeORM

### B1.1 — Entidad `Tenant`

- [x] Crear `api/src/modules/tenants/entities/tenant.entity.ts` con campos: `id` (UUID PK), `slug` (varchar 100, unique, indexed), `name` (varchar 255), `isActive` (boolean, default true), `createdAt`, `updatedAt`
- [x] Verificar que el `slug` tiene `@Index({ unique: true })` además de `unique: true` en `@Column`

**Criterio de done:** Entidad TypeORM compilable. La migración generará tabla `tenants`.

---

### B1.2 — Entidad `User`

- [x] Crear `api/src/modules/auth/entities/user.entity.ts` con: `id` (UUID PK), `tenantId` (uuid, FK a `tenants`), `email` (varchar 255), `passwordHash` (varchar 255), `role` (enum `admin|staff`, default `admin`), `refreshToken` (text, nullable), `resetPasswordToken` (varchar 255, nullable), `resetPasswordExpiresAt` (timestamp, nullable), `isActive` (boolean, default true), `createdAt`, `updatedAt`
- [x] Agregar `@Index(['tenantId', 'email'], { unique: true })` a nivel de clase
- [x] ManyToOne a `Tenant` con `onDelete: 'RESTRICT'`

**Criterio de done:** Índice único compuesto en `(tenant_id, email)` presente en la entidad.

---

### B1.3 — Entidad `StoreSettings`

- [x] Crear `api/src/modules/tenants/entities/store-settings.entity.ts` con: `id` (UUID PK), `tenantId` (uuid, unique, FK a `tenants`), `description` (text, nullable), `logoUrl` (text, nullable), `phone` (varchar 50, nullable), `whatsapp` (varchar 50, nullable), `address` (text, nullable)
- [x] Agregar campo `schedule` (jsonb, nullable) para almacenar `DaySchedule[]`
- [x] Agregar campo `timezone` (varchar 100, default `'America/Argentina/Buenos_Aires'`)
- [x] Agregar campos de tema: `primaryColor` (varchar 7, default `'#000000'`), `accentColor` (varchar 7, default `'#ffffff'`)
- [x] Agregar campos de entrega: `deliveryEnabled` (boolean, false), `deliveryCost` (integer, 0 — centavos), `deliveryMinOrder` (integer, 0 — centavos), `takeawayEnabled` (boolean, true), `inStoreEnabled` (boolean, false)
- [x] Agregar campos de pagos: `cashEnabled` (boolean, true), `transferEnabled` (boolean, false), `transferAlias` (varchar 100, nullable), `cardEnabled` (boolean, false)
- [x] Exportar interfaces `Shift` y `DaySchedule` desde este archivo
- [x] OneToOne a `Tenant` con `onDelete: 'CASCADE'`

**Criterio de done:** Entidad compilable. Los montos de entrega son `integer` (centavos).

---

### B1.4 — Entidad `Category`

- [x] Crear `api/src/modules/catalog/entities/category.entity.ts` con: `id` (UUID PK), `tenantId` (uuid, FK a `tenants`), `name` (varchar 255), `imageUrl` (text, nullable), `order` (integer, default 0), `isActive` (boolean, default true), `createdAt`, `updatedAt`
- [x] Agregar `@Index(['tenantId', 'order'])` a nivel de clase

**Criterio de done:** Índice compuesto `(tenant_id, order)` presente.

---

### B1.5 — Entidad `Product`

- [x] Crear `api/src/modules/catalog/entities/product.entity.ts` con: `id` (UUID PK), `tenantId` (uuid, FK), `categoryId` (uuid, FK a `categories`), `name` (varchar 255), `description` (text, nullable), `price` (**integer** — centavos, **NUNCA float/decimal**), `imageUrl` (text, nullable), `isFeatured` (boolean, false), `isActive` (boolean, true), `order` (integer, 0), `createdAt`, `updatedAt`
- [x] Agregar `@Index(['tenantId', 'categoryId'])` y `@Index(['tenantId', 'isActive'])` a nivel de clase
- [x] OneToMany a `OptionGroup` con `cascade: true`

**Criterio de done:** Campo `price` es `type: 'integer'` sin excepción.

---

### B1.6 — Entidades `OptionGroup` y `OptionItem`

- [x] Crear `api/src/modules/catalog/entities/option-group.entity.ts` con: `id` (UUID PK), `productId` (uuid, FK a `products`), `name` (varchar 255), `type` (enum `radio|checkbox`, default `radio`), `isRequired` (boolean, false), `minSelections` (integer, 0), `maxSelections` (integer, 1), `order` (integer, 0), `createdAt`
- [x] ManyToOne a `Product` con `onDelete: 'CASCADE'`
- [x] OneToMany a `OptionItem` con `cascade: true`
- [x] Crear `api/src/modules/catalog/entities/option-item.entity.ts` con: `id` (UUID PK), `optionGroupId` (uuid, FK a `option_groups`), `name` (varchar 255), `priceModifier` (**integer**, centavos, default 0), `isDefault` (boolean, false), `order` (integer, 0), `createdAt`
- [x] ManyToOne a `OptionGroup` con `onDelete: 'CASCADE'`

**Criterio de done:** `priceModifier` es `integer`. Cascadas correctas en ambas entidades.

---

### B1.7 — Entidad `Order`

- [x] Crear `api/src/modules/orders/entities/order.entity.ts` con: `id` (UUID PK), `tenantId` (uuid, FK), `orderNumber` (varchar 50), `status` (enum `pending|confirmed|preparing|ready|delivered|cancelled`, default `pending`), `deliveryMethod` (enum `delivery|takeaway|in_store`), `paymentMethod` (enum `cash|transfer|card|other`), `subtotal` (integer — centavos), `deliveryCost` (integer — centavos, default 0), `total` (integer — centavos), `customerInfo` (jsonb), `notes` (text, nullable), `internalNotes` (text, nullable), `statusHistory` (jsonb, default `[]`), `createdAt`, `updatedAt`
- [x] Agregar `@Index(['tenantId', 'status'])` y `@Index(['tenantId', 'createdAt'])` a nivel de clase
- [x] OneToMany a `OrderItem` con `cascade: true`
- [x] Exportar enums: `OrderStatus`, `DeliveryMethod`, `PaymentMethod`

**Criterio de done:** Todos los montos son `integer`. Enums exportados para uso en Service.

---

### B1.8 — Entidad `OrderItem`

- [x] Crear `api/src/modules/orders/entities/order-item.entity.ts` con: `id` (UUID PK), `orderId` (uuid, FK a `orders`), `productId` (uuid), `productName` (varchar 255 — snapshot), `unitPrice` (**integer** — centavos, snapshot), `quantity` (integer, default 1), `selectedOptions` (jsonb, default `[]`), `itemNote` (text, nullable), `subtotal` (**integer** — centavos), `createdAt`
- [x] ManyToOne a `Order` con `onDelete: 'CASCADE'`

**Criterio de done:** `unitPrice` y `subtotal` son `integer`. `productName` es snapshot (no FK).

---

### B1.9 — Generar y verificar migración

- [x] Agregar script `migration:generate` en `api/package.json` si no existe: `"migration:generate": "typeorm-ts-node-commonjs migration:generate src/migrations/$npm_config_name -d src/config/data-source.ts"`
- [x] Crear `api/src/config/data-source.ts` (DataSource para CLI de TypeORM — separado del módulo de NestJS)
- [x] **Avisar al desarrollador** para ejecutar `npm run migration:generate -- --name=InitialSchema` en `api/`
- [x] Verificar que la migración generada contiene las tablas: `tenants`, `users`, `store_settings`, `categories`, `products`, `option_groups`, `option_items`, `orders`, `order_items`
- [x] Verificar que ninguna columna de precio/monto usa `decimal` o `float` — solo `integer`

> ⚠️ **No ejecutar `npm run migration:run` sin revisión manual del SQL generado.**

**Criterio de done:** `npm run migration:generate` sale con código 0 y genera archivo de migración.

---

## F1-B: Módulo Auth

### B1.10 — Instalar dependencias de bcrypt

- [x] Instalar `npm install bcrypt`
- [x] Instalar `npm install --save-dev @types/bcrypt`

**Criterio de done:** `import * as bcrypt from 'bcrypt'` no da errores de tipo.

---

### B1.11 — JWT Config (`jwt.config.ts`)

- [x] Crear `api/src/config/jwt.config.ts` usando `registerAs('jwt', ...)`:
  - `privateKey`: decodificar base64 desde `JWT_PRIVATE_KEY`
  - `publicKey`: decodificar base64 desde `JWT_PUBLIC_KEY`
  - `accessExpiration`: desde `JWT_ACCESS_EXPIRATION` (default `'15m'`)
  - `refreshExpiration`: desde `JWT_REFRESH_EXPIRATION` (default `'7d'`)
- [x] Agregar `jwtConfig` al array `load` de `ConfigModule.forRoot(...)` en `AppModule`
- [x] Agregar variables `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `BCRYPT_ROUNDS` a `api/.env.example`
- [x] Agregar validación de estas variables al `envSchema` Zod en `env.config.ts`

**Criterio de done:** `configService.get('jwt.publicKey')` retorna la clave pública desde la variable de entorno.

---

### B1.12 — JWT Strategy (RS256)

- [x] Crear `api/src/modules/auth/strategies/jwt.strategy.ts` extendiendo `PassportStrategy(Strategy)`
- [x] Configurar: `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`, `secretOrKey` desde `configService.get('jwt.publicKey')`, `algorithms: ['RS256']`
- [x] Exportar interfaz `JwtPayload` con campos: `sub`, `email`, `tenantId`, `iat`, `exp`
- [x] Método `validate(payload: JwtPayload)` retorna `{ userId: payload.sub, email: payload.email, tenantId: payload.tenantId }`

**Criterio de done:** `algorithms: ['RS256']` presente. NO usar `secretOrKey` con clave simétrica.

---

### B1.13 — AuthModule

- [x] Crear `api/src/modules/auth/auth.module.ts`:
  - `TypeOrmModule.forFeature([User])`
  - `PassportModule.register({ defaultStrategy: 'jwt' })`
  - `JwtModule.registerAsync({ useFactory: (config) => ({ privateKey: config.get('jwt.privateKey'), publicKey: config.get('jwt.publicKey'), signOptions: { algorithm: 'RS256', expiresIn: config.get('jwt.accessExpiration') } }), inject: [ConfigService] })`
  - `providers: [AuthService, JwtStrategy]`
  - `controllers: [AuthController]`
  - `exports: [JwtStrategy, PassportModule]`

**Criterio de done:** Módulo registra `JwtModule` con RS256. No usa HS256.

---

### B1.14 — TenantsModule (mínimo para FASE 1)

- [x] Crear `api/src/modules/tenants/tenants.module.ts`:
  - `TypeOrmModule.forFeature([Tenant, StoreSettings])`
  - Sin controller ni service en esta fase (se implementan en FASE 3)
  - `exports: [TypeOrmModule]` para que `AuthModule` pueda usar el repositorio de `Tenant`

**Criterio de done:** `TenantsModule` importable en `AuthModule`.

---

### B1.15 — AuthService: registro (`POST /auth/register`)

- [x] Crear `api/src/modules/auth/auth.service.ts` con método `register(dto: RegisterDto)`:
  - Verificar que el `slug` no existe en `tenants` → lanzar `BusinessException` con código `SLUG_ALREADY_EXISTS` si ya existe
  - Verificar que el `email` no existe para el tenant → prevenir duplicados
  - Crear registro `Tenant` con `slug`, `name` (de `storeName`), `isActive: true`
  - Hashear password con `bcrypt.hash(dto.password, rounds)` donde `rounds = configService.get('BCRYPT_ROUNDS', 12)`
  - Crear registro `User` con `tenantId`, `email`, `passwordHash`, `role: UserRole.ADMIN`
  - Crear registro `StoreSettings` con `tenantId` y valores por defecto
  - Todo dentro de una transacción TypeORM (`queryRunner`)
  - Retornar `{ access_token: string }` — emitir JWT al finalizar

**Criterio de done:** Registro crea 3 registros (Tenant + User + StoreSettings) en transacción. Password no en plain text.

---

### B1.16 — AuthService: login (`POST /auth/login`)

- [x] Agregar método `login(dto: LoginDto, response: Response)` a `AuthService`:
  - Buscar `User` por `email` — lanzar `UnauthorizedException` genérica si no existe (no revelar si existe)
  - Verificar `bcrypt.compare(dto.password, user.passwordHash)` — mismo error genérico si falla
  - Verificar que `user.isActive` y `user.tenant.isActive`
  - Generar `access_token` con `jwtService.sign({ sub, email, tenantId }, { algorithm: 'RS256', expiresIn: '15m' })`
  - Generar `refreshToken` (UUID v4 hasheado con bcrypt) y guardarlo en `user.refreshToken`
  - Setear cookie httpOnly: `response.cookie('refresh-token', refreshToken, { httpOnly: true, secure: isProduction, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 })`
  - Retornar `{ access_token }`

**Criterio de done:** Login retorna `{ access_token }`. Cookie `refresh-token` seteada con `httpOnly: true, sameSite: 'strict'`.

---

### B1.17 — AuthService: refresh token (`POST /auth/refresh`)

- [x] Agregar método `refresh(refreshToken: string, response: Response)` a `AuthService`:
  - Buscar usuario con el `refreshToken` hasheado almacenado
  - Verificar que el refresh token es válido con `bcrypt.compare`
  - Verificar que `user.isActive`
  - Emitir nuevo `access_token`
  - Retornar `{ access_token }`

**Criterio de done:** Cookie válida → nuevo access token. Cookie inválida → 401.

---

### B1.18 — AuthService: logout (`POST /auth/logout`)

- [x] Agregar método `logout(userId: string, response: Response)` a `AuthService`:
  - Actualizar `user.refreshToken = null` en base de datos
  - Limpiar cookie: `response.clearCookie('refresh-token')`
  - Retornar `{ message: 'ok' }`

**Criterio de done:** `User.refreshToken` es `null` después del logout. Cookie eliminada.

---

### B1.19 — AuthService: forgot-password y reset-password

- [x] Agregar método `forgotPassword(dto: ForgotPasswordDto)` a `AuthService`:
  - Buscar usuario por email — si no existe, retornar respuesta exitosa igualmente (no revelar existencia)
  - Generar token de reset seguro con `crypto.randomBytes(32).toString('hex')`
  - Guardar `resetPasswordToken` (hasheado con bcrypt) y `resetPasswordExpiresAt` (1 hora desde ahora) en el usuario
  - **TODO: enviar email** con link `${FRONTEND_URL}/auth/reset-password?token=<token>` — comentado hasta integrar servicio de email
  - Retornar `{ message: 'Si el email existe, recibirás un correo con instrucciones.' }`
- [x] Agregar método `resetPassword(dto: ResetPasswordDto)` a `AuthService`:
  - Buscar usuarios con `resetPasswordToken` no nulo y `resetPasswordExpiresAt > now`
  - Verificar `bcrypt.compare(dto.token, user.resetPasswordToken)`
  - Si válido: hashear nueva password, limpiar `resetPasswordToken` y `resetPasswordExpiresAt`, guardar
  - Retornar `{ message: 'Contraseña actualizada.' }`

**Criterio de done:** Token de reset es de un solo uso. Respuesta de `forgotPassword` no revela existencia del usuario.

---

### B1.20 — AuthController

- [x] Crear `api/src/modules/auth/auth.controller.ts` con los endpoints:
  - `POST /auth/register` → `authService.register(dto)` — sin guard
  - `POST /auth/login` → `authService.login(dto, @Res({ passthrough: true }) res)` — sin guard
  - `POST /auth/refresh` → lee cookie `refresh-token` con `@Req()`, llama `authService.refresh(token, res)` — sin guard
  - `POST /auth/logout` → `@UseGuards(JwtAuthGuard)`, llama `authService.logout(user.userId, res)`
  - `POST /auth/forgot-password` → `authService.forgotPassword(dto)` — sin guard
  - `POST /auth/reset-password` → `authService.resetPassword(dto)` — sin guard

**Criterio de done:** Todos los endpoints definidos. `/auth/logout` requiere JWT válido.

---

### B1.21 — Guards activos

- [x] Activar `api/src/common/guards/jwt-auth.guard.ts`: implementar `extends AuthGuard('jwt')` (quitar stub si existía)
- [x] Activar `api/src/common/guards/roles.guard.ts`: implementar `CanActivate` usando `Reflector` y `ROLES_KEY`
- [x] Activar `api/src/common/guards/tenant.guard.ts`: implementar `CanActivate` — verificar que `request.user.tenantId` está presente (la validación de ownership por recurso es responsabilidad de cada Service)
- [x] Crear `api/src/common/decorators/roles.decorator.ts` con `ROLES_KEY` y `@Roles(...roles)` decorator

**Criterio de done:** `GET /admin/test` con `@UseGuards(JwtAuthGuard)` retorna 401 sin token, 200 con token válido.

---

### B1.22 — TenantContextInterceptor activado

- [x] Activar `api/src/common/interceptors/tenant-context.interceptor.ts`: extraer `request.user.tenantId` y asignarlo a `request.tenantId`
- [x] Activar `api/src/common/decorators/tenant-id.decorator.ts`: `createParamDecorator` que extrae `request.tenantId`
- [x] Activar `api/src/common/decorators/current-user.decorator.ts`: `createParamDecorator` que extrae `request.user`
- [x] Registrar `TenantContextInterceptor` como provider global en `AppModule` (si no estaba registrado)

**Criterio de done:** En un controller protegido, `@TenantId() tenantId: string` recibe el `tenantId` del JWT correctamente.

---

### B1.23 — Registrar módulos en AppModule

- [x] Importar `TenantsModule` en `AppModule`
- [x] Importar `AuthModule` en `AppModule`
- [x] Agregar `jwtConfig` al array `load` de `ConfigModule.forRoot(...)`
- [x] Verificar: `npm run start:dev` arranca sin errores

**Criterio de done:** `npm run start:dev` muestra todos los módulos iniciados. No hay errores de DI.

---

## Verificación final

- [x] Ejecutar `npm run typecheck` en `api/` → 0 errores
- [x] Verificar que ninguna entidad usa `type: 'decimal'` o `type: 'float'` para montos — solo `type: 'integer'`
- [x] Verificar que `jwt.config.ts` usa `algorithms: ['RS256']` y no `'HS256'`
- [x] Verificar que el refresh token se setea con `httpOnly: true` y `sameSite: 'strict'`
- [x] Verificar que `synchronize: false` sigue presente en `database.config.ts`
- [x] **Avisar al desarrollador** para generar migración: `cd api && npm run migration:generate -- --name=InitialSchema`
