# Proposal — api-fase-0-setup-infraestructura

## Resumen

Configuración completa de la infraestructura base del backend NestJS para el MVP de PickyApp. Este change establece los cimientos técnicos sobre los cuales se construirán todos los módulos de dominio: TypeScript strict, Docker con PostgreSQL 16, TypeORM configurado correctamente, gestión de entorno validada, y la capa `common/` con todos los filtros, interceptors, guards y decorators globales.

## Motivación

El proyecto NestJS está inicializado como scaffolding vacío. Sin este setup:
- TypeScript no tiene strict mode → errores latentes llegan a producción.
- No hay base de datos disponible para desarrollo → bloqueante para cualquier módulo.
- TypeORM sin configuración explícita podría caer en `synchronize: true` → riesgo crítico en producción.
- Sin envelope de respuestas (`data/meta/error`) el frontend no puede consumir la API de forma consistente.
- Sin guards y decorators base no se puede implementar ningún endpoint protegido.

## Objetivos

1. TypeScript strict mode activado y verificable con `npm run typecheck`.
2. Docker Compose levanta PostgreSQL 16 en puerto 5432 con un solo comando.
3. TypeORM conecta a la base de datos con `synchronize: false` y pool de conexiones configurado.
4. Variables de entorno validadas al arrancar — la app falla de forma explícita si falta alguna requerida.
5. Módulo `common/` con filtros, interceptors, guards y decorators listos para ser usados por cualquier módulo.
6. Respuestas exitosas con envelope `{ data, meta }` y errores con `{ error: { code, message } }`.

## Impacto en Multi-tenancy

- El `TenantContextInterceptor` es el punto de entrada del contexto multi-tenant: extrae `tenantId` del JWT y lo inyecta en `request.tenantId`.
- El decorator `@TenantId()` permite que cualquier controller consuma ese valor de forma limpia.
- El `TenantContextGuard` (también llamado `tenant.guard.ts`) valida que el `tenantId` del token coincida con el recurso solicitado.
- Este setup es el prerequisito para todo endpoint que opere sobre datos de un tenant específico.

## Afecta

- **Panel Admin**: sí — toda operación admin depende de guards y contexto de tenant.
- **Tienda Pública**: indirectamente — el envelope de respuesta afecta a los endpoints públicos también.

## Fuera de scope

- Entidades TypeORM y migraciones (FASE 1).
- Módulo Auth (FASE 1).
- Módulos de dominio: Catalog, Orders, Tenants (FASEs 2–4).

## Dependencias externas

- Docker Desktop instalado en la máquina del desarrollador.
- Node.js 20+ y npm.
- Paquetes npm adicionales a instalar: `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `pg`, `zod`, `class-validator`, `class-transformer`.
