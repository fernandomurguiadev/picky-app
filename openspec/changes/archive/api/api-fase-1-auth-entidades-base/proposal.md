# Proposal — api-fase-1-auth-entidades-base

## Resumen

Implementación completa de las entidades TypeORM base del dominio y del módulo de autenticación (registro, login, JWT RS256, refresh token, logout, recupero de contraseña). Este change establece el modelo relacional completo del MVP y el sistema de seguridad sobre el cual operarán todos los módulos de dominio posteriores.

## Motivación

La FASE 0 dejó la infraestructura lista (Docker, TypeORM config, common/). Sin este change:
- No existe modelo de datos — ningún módulo puede persistir información.
- No hay autenticación — ningún endpoint protegido puede implementarse.
- Sin JWT + guards activos, los stubs de `JwtAuthGuard`, `RolesGuard` y `TenantContextGuard` no cumplen función.
- El contexto multi-tenant (`tenantId` en el JWT) no está disponible para los interceptors existentes.

## Objetivos

1. Todas las entidades del dominio MVP creadas como clases TypeORM con columnas, relaciones e índices correctos.
2. Comando `npm run migration:generate -- --name=InitialSchema` genera migración sin errores.
3. Módulo Auth completo: registro (Tenant + User), login (JWT RS256 + httpOnly cookie), refresh, logout y recupero de contraseña.
4. JWT firmado con RS256. Claves leídas desde variables de entorno (Vault KV-v2 en producción).
5. Guards activos: `JwtAuthGuard`, `RolesGuard`, `TenantContextGuard`.
6. Decorator `@TenantId()` funcional — extrae `tenantId` del JWT vía `TenantContextInterceptor`.

## Impacto en Multi-tenancy

- **Entidad `Tenant`**: raíz del modelo multi-tenant. Cada comercio es un registro en `tenants`.
- **Entidad `User`**: siempre tiene `tenant_id` como FK — un usuario pertenece a exactamente un comercio.
- **Todas las entidades de negocio** (`Category`, `Product`, `OptionGroup`, `OptionItem`, `Order`, `OrderItem`, `StoreSettings`) tienen `tenant_id` como primer campo de sus índices compuestos.
- **JWT claim `tenantId`**: emitido en el payload del access token — es el mecanismo de RLS a nivel lógico en la aplicación.
- **`TenantContextGuard`**: valida que el `tenantId` del token coincida con el recurso solicitado antes de cualquier operación admin.

## Afecta

- **Panel Admin**: sí — todos los endpoints protegidos del admin dependen de guards activos y JWT válido.
- **Tienda Pública**: parcialmente — los endpoints públicos por `slug` dependen de la entidad `Tenant` para resolver `tenantId`.
- **Módulo Catálogo (FASE 2)**: bloqueado hasta que existan las entidades `Category`, `Product`, `OptionGroup`, `OptionItem`.
- **Módulo Órdenes (FASE 5)**: bloqueado hasta que existan las entidades `Order`, `OrderItem`.
- **Módulo Tenants/Config (FASE 3)**: bloqueado hasta que exista la entidad `StoreSettings`.

## Fuera de scope

- Endpoints de Catálogo, Tenants, Órdenes, Upload (FASEs 2–5).
- WebSocket Gateway (FASE 6).
- Reset de contraseña por email real (requiere servicio de email — la lógica del token se implementa, el envío es un TODO comentado).

## Dependencias externas

- FASE 0 completada: `docker-compose.yml` levantado, TypeORM configurado, `common/` con estructura base.
- Paquetes ya instalados en FASE 0: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`.
- Paquetes adicionales a instalar: `bcrypt`, `@types/bcrypt`.
- Variables de entorno nuevas: `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_ACCESS_EXPIRATION` (15m), `JWT_REFRESH_EXPIRATION` (7d), `BCRYPT_ROUNDS` (12).
- Para generar par de claves RS256 localmente:
  ```bash
  openssl genrsa -out private.pem 2048
  openssl rsa -in private.pem -pubout -out public.pem
  # Convertir a base64 para variable de entorno:
  base64 -w 0 private.pem
  base64 -w 0 public.pem
  ```
