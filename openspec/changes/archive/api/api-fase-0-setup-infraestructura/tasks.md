# Tasks — api-fase-0-setup-infraestructura

## Fase de implementación: FASE 0 — Setup e Infraestructura Base

---

## B0.1 — TypeScript strict mode

- [x] Actualizar `api/tsconfig.json`: agregar `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, `"strictFunctionTypes": true`, `"strictBindCallApply": true`, `"strictPropertyInitialization": true`, `"noImplicitThis": true`, `"alwaysStrict": true`
- [x] Actualizar `api/tsconfig.build.json`: extender `tsconfig.json` y excluir `test`, `dist`, `**/*spec.ts`
- [x] Verificar: `npm run typecheck` ejecuta sin errores en `api/`

**Criterio de done:** `npm run typecheck` sale con código 0.

---

## B0.2 — Docker Compose con PostgreSQL 16

- [x] Crear `api/docker-compose.yml` con servicio `postgres` (imagen `postgres:16-alpine`)
  - Variables de entorno leídas desde `.env` con fallbacks
  - Puerto `5432` expuesto
  - Volumen `postgres_data` para persistencia
  - `healthcheck` configurado con `pg_isready`
- [x] Verificar: `docker compose up -d` (desde `api/`) levanta PostgreSQL sin errores
- [x] Verificar: `docker compose ps` muestra el servicio `healthy`

**Criterio de done:** `docker compose up -d` levanta PostgreSQL en puerto 5432 accesible localmente.

---

## B0.3 — TypeORM y database.config.ts

- [x] Instalar dependencias: `npm install @nestjs/typeorm typeorm pg`
- [x] Crear `api/src/config/database.config.ts` usando `registerAs('database', ...)`:
  - `type: 'postgres'`
  - `synchronize: false` (obligatorio, nunca cambiar a true)
  - `entities` apuntan a `**/*.entity{.ts,.js}`
  - `migrations` apuntan a `../migrations/*{.ts,.js}`
  - `extra.max: 20`, `extra.min: 2` (pool de conexiones)
  - `logging` habilitado solo en `development`
- [x] Actualizar `api/src/app.module.ts`:
  - Importar `TypeOrmModule.forRootAsync` con `useFactory` desde `ConfigService`
- [x] Verificar: `npm run start:dev` arranca y conecta a PostgreSQL sin errores

**Criterio de done:** App arranca y el log no muestra errores de conexión a la base de datos.

---

## B0.4 — Variables de entorno con validación Zod

- [x] Instalar dependencias: `npm install @nestjs/config zod`
- [x] Crear `api/src/config/env.config.ts` con `envSchema` (Zod) que valide:
  - `NODE_ENV`, `PORT`
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`
- [x] Exportar función `validateEnv(config)` que usa `envSchema.safeParse` y lanza error descriptivo si falla
- [x] Crear `api/.env.example` con todas las variables requeridas documentadas
- [x] Actualizar `api/src/app.module.ts`: configurar `ConfigModule.forRoot({ validate: validateEnv, isGlobal: true, load: [databaseConfig] })`
- [x] Verificar: arrancar sin `.env` (o con variable faltante) produce error explicativo en consola
- [x] Crear `api/.env` local basado en `.env.example` (no commitear — verificar en `.gitignore`)

**Criterio de done:** App falla al arrancar con mensaje claro si falta `DB_HOST` u otra variable requerida.

---

## B0.5 — Estructura `common/`

- [x] Crear directorio `api/src/common/` con subdirectorios: `filters/`, `interceptors/`, `decorators/`, `guards/`
- [x] Instalar dependencias: `npm install class-validator class-transformer @nestjs/passport passport passport-jwt @nestjs/jwt`
- [x] Instalar dev: `npm install --save-dev @types/passport-jwt`
- [x] Habilitar en `main.ts`: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`

**Criterio de done:** Estructura de carpetas existe y la app arranca con `ValidationPipe` global.

---

## B0.6 — HttpExceptionFilter (envelope de errores)

- [x] Crear `api/src/common/filters/http-exception.filter.ts`:
  - Implementa `ExceptionFilter` con `@Catch()`
  - Captura `HttpException` → formatea `{ error: { code, message, statusCode } }`
  - Captura errores no controlados → responde `500` con `INTERNAL_SERVER_ERROR`
  - Loguea errores internos con `Logger` de NestJS (nunca exponer stack al cliente)
- [x] Registrar en `AppModule` como provider global: `{ provide: APP_FILTER, useClass: HttpExceptionFilter }`
- [x] Verificar: `GET /ruta-inexistente` retorna `{ error: { code: "NOT_FOUND", message: "...", statusCode: 404 } }`

**Criterio de done:** Respuesta de error 404 tiene exactamente la forma `{ error: { code, message, statusCode } }`.

---

## B0.7 — TransformInterceptor (envelope de respuestas exitosas)

- [x] Crear `api/src/common/interceptors/transform.interceptor.ts`:
  - Implementa `NestInterceptor`
  - Envuelve la respuesta en `{ data: <valor original>, meta: { timestamp: ISO8601 } }`
  - Si el valor ya tiene forma `{ data, meta }` → pasa sin modificar (respuestas paginadas)
- [x] Registrar en `AppModule` como provider global: `{ provide: APP_INTERCEPTOR, useClass: TransformInterceptor }`
- [x] Verificar: `GET /` (app controller existente) retorna `{ data: "Hello World!", meta: { timestamp: "..." } }`

**Criterio de done:** Todo endpoint existente retorna respuesta con envelope `{ data, meta }`.

---

## B0.8 — Stubs de guards y decorators (prerequisito FASE 1)

- [x] Crear `api/src/common/guards/jwt-auth.guard.ts`: extiende `AuthGuard('jwt')` de `@nestjs/passport`
- [x] Crear `api/src/common/guards/roles.guard.ts`: lee metadata `Roles` y compara con `request.user?.role`
- [x] Crear `api/src/common/guards/tenant.guard.ts`: valida `request.tenantId` contra parámetro `:tenantId` si existe
- [x] Crear `api/src/common/interceptors/tenant-context.interceptor.ts`: extrae `tenantId` de `request.user?.tenantId` y lo asigna a `request.tenantId`
- [x] Crear `api/src/common/decorators/tenant-id.decorator.ts`: `createParamDecorator` que retorna `request.tenantId`
- [x] Crear `api/src/common/decorators/current-user.decorator.ts`: `createParamDecorator` que retorna `request.user`
- [x] Verificar: `npm run typecheck` sin errores tras crear todos los stubs

**Criterio de done:** Todos los archivos existen, compilan sin errores. Los guards no bloquean requests todavía (activos en FASE 1).

---

## Verificación final FASE 0

- [x] `npm run typecheck` → 0 errores
- [x] `docker compose up -d` → PostgreSQL healthy
- [x] `npm run start:dev` → app arranca conectada a la base de datos
- [x] `GET http://localhost:3000/` → `{ data: "Hello World!", meta: { timestamp: "..." } }`
- [x] `GET http://localhost:3000/ruta-no-existe` → `{ error: { code: "NOT_FOUND", statusCode: 404, message: "..." } }`
- [x] Arrancar sin variable `DB_HOST` en `.env` → error descriptivo en consola
