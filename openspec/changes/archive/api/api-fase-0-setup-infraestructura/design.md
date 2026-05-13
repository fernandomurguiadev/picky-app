# Design — api-fase-0-setup-infraestructura

## Estructura de archivos resultante

```
api/
├── docker-compose.yml                         ← NUEVO
├── .env.example                               ← NUEVO
├── tsconfig.json                              ← MODIFICADO (strict mode)
├── tsconfig.build.json                        ← MODIFICADO (excluir test/)
└── src/
    ├── app.module.ts                          ← MODIFICADO (registrar ConfigModule, TypeOrmModule, interceptors globales)
    ├── config/
    │   ├── database.config.ts                 ← NUEVO
    │   └── env.config.ts                      ← NUEVO
    └── common/
        ├── filters/
        │   └── http-exception.filter.ts       ← NUEVO
        ├── interceptors/
        │   ├── transform.interceptor.ts       ← NUEVO
        │   └── tenant-context.interceptor.ts  ← NUEVO (stub — activado en FASE 1 con JWT)
        ├── decorators/
        │   ├── tenant-id.decorator.ts         ← NUEVO
        │   └── current-user.decorator.ts      ← NUEVO
        └── guards/
            ├── jwt-auth.guard.ts              ← NUEVO (stub — activo en FASE 1)
            ├── roles.guard.ts                 ← NUEVO (stub — activo en FASE 1)
            └── tenant.guard.ts                ← NUEVO (stub — activo en FASE 1)
```

---

## B0.1 — TypeScript strict mode

### `tsconfig.json`

Agregar las siguientes opciones al `compilerOptions` existente:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

> `noUncheckedIndexedAccess` y `noUnused*` se dejan en `false` para no bloquear el desarrollo — se activarán en una auditoría de calidad posterior.

### `tsconfig.build.json`

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

---

## B0.2 — Docker Compose

### `docker-compose.yml`

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: picky_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-picky}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-picky_secret}
      POSTGRES_DB: ${DB_NAME:-picky_db}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-picky}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## B0.3 — TypeORM Database Config

### `src/config/database.config.ts`

```typescript
import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export const databaseConfig = registerAs('database', (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'picky',
  password: process.env.DB_PASSWORD ?? 'picky_secret',
  database: process.env.DB_NAME ?? 'picky_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,        // NUNCA true en producción
  logging: process.env.NODE_ENV === 'development',
  extra: {
    max: 20,                 // pool máximo
    min: 2,                  // pool mínimo
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
}));
```

El `AppModule` carga este config así:

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (cfg: ConfigService) => cfg.get('database') as DataSourceOptions,
  inject: [ConfigService],
}),
```

---

## B0.4 — Variables de entorno con validación Zod

### `src/config/env.config.ts`

```typescript
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  // JWT — RS256 (FASE 1 las usará; se validan aquí para fail-fast)
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Configuración de entorno inválida:\n${formatted}`);
  }
  return result.data;
}
```

### `.env.example`

```dotenv
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=picky
DB_PASSWORD=picky_secret
DB_NAME=picky_db

# JWT RS256 — generar con: openssl genrsa -out private.pem 2048
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### `AppModule` — cargar configuración

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  validate: validateEnv,
  load: [databaseConfig],
}),
```

---

## B0.5 — Estructura `common/`

No contiene lógica de módulo. Todos los artefactos se exportan desde `src/common/index.ts` para facilitar los imports.

---

## B0.6 — HttpExceptionFilter (envelope de errores)

### `src/common/filters/http-exception.filter.ts`

Formato de respuesta de error:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "El recurso solicitado no existe.",
    "statusCode": 404
  }
}
```

Captura `HttpException` y errores no controlados. Los errores no controlados devuelven `500` con `INTERNAL_SERVER_ERROR`.

---

## B0.7 — TransformInterceptor (envelope de respuestas exitosas)

### `src/common/interceptors/transform.interceptor.ts`

Formato de respuesta exitosa:

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-05-13T00:00:00.000Z"
  }
}
```

Para respuestas paginadas, el controller puede devolver `{ data, meta: { page, limit, total } }` y el interceptor lo pasa sin modificar si detecta la estructura.

---

## Stubs FASE 0 (guards y tenant interceptor)

Los siguientes archivos se crean como stubs funcionales en FASE 0. Se implementan completamente en FASE 1 cuando esté disponible el módulo Auth y JWT:

| Archivo | Comportamiento en stub |
|---------|----------------------|
| `jwt-auth.guard.ts` | Extiende `AuthGuard('jwt')` de `@nestjs/passport` — activo cuando se configure JwtStrategy |
| `roles.guard.ts` | Lee metadata `@Roles(...)` y compara con `request.user.role` |
| `tenant.guard.ts` | Compara `request.tenantId` con el recurso — activo desde FASE 1 |
| `tenant-context.interceptor.ts` | Extrae `tenantId` del payload JWT en `request.user` e inyecta en `request.tenantId` |
| `@TenantId()` decorator | `createParamDecorator` que lee `request.tenantId` |
| `@CurrentUser()` decorator | `createParamDecorator` que lee `request.user` |

---

## Dependencias npm a instalar

```bash
npm install @nestjs/config @nestjs/typeorm typeorm pg zod class-validator class-transformer @nestjs/passport passport passport-jwt @nestjs/jwt
npm install --save-dev @types/passport-jwt
```

---

## Registro global en `AppModule`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, load: [databaseConfig] }),
    TypeOrmModule.forRootAsync({ ... }),
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
```
