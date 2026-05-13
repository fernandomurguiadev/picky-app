---
name: tenant-patterns
description: >
  Patrones de Row-Level Security (RLS) multi-tenant en PickyApp API.
  TenantInterceptor, SET LOCAL, QueryRunner transaccional, @SkipRls y bypass por rol.
version: "1.0"
used_by:
  - backend-agent  # implementación de endpoints multi-tenant
  - db-agent       # migraciones, entidades y queries con contexto de tenant
last_reviewed: 2026-05-05
---

# RLS Patterns — PickyApp API (Multi-Tenant)

## Concepto

Cada request autenticado opera dentro de una transacción PostgreSQL con:

```sql
SET LOCAL app.current_tenant_id = '<uuid>';
```

Las políticas RLS de PostgreSQL usan ese valor para filtrar automáticamente todas las queries.
El `TenantInterceptor` en `src/common/interceptors/rls.interceptor.ts` gestiona este ciclo completo.

---

## Ciclo de vida del TenantInterceptor

```
Request entra
  ↓
¿Tiene @SkipRls()? → Sí → bypass completo, next.handle()
  ↓ No
¿platform_role == 'super_admin'? → Sí → bypass (BYPASSRLS PostgreSQL), next.handle()
  ↓ No
¿tenant_id en JWT? → No → throw ForbiddenException (INVALID_TENANT_CONTEXT)
  ↓ Sí
¿tenant_id es UUID válido? → No → throw ForbiddenException (INVALID_TENANT_ID_FORMAT)
  ↓ Sí
QueryRunner.connect()
  → startTransaction()
  → SET LOCAL app.current_tenant_id = '<uuid>'
  → request.rlsQueryRunner = runner     ← disponible en controllers
  → next.handle()
      ↓ (fin del handler)
  → commitTransaction()
  → runner.release()
```

Si ocurre un error en el handler:
```
  → rollbackTransaction()
  → runner.release()
  → el GlobalExceptionFilter maneja el error
```

---

## Reglas fundamentales

- **Toda entidad multi-tenant debe tener columna `tenant_id` indexada.**
- Los índices deben ser compuestos con `tenant_id` como primer campo.
- Las políticas RLS en PostgreSQL verifican `current_setting('app.current_tenant_id')`.
- `super_admin` tiene rol `BYPASSRLS` en PostgreSQL — no necesita SET LOCAL.

---

## Diseño de entidades multi-tenant

```typescript
@Entity('payment_intents')
@Index(['tenant_id', 'estado'])                    // tenant_id siempre primero
@Index(['tenant_id', 'user_id', 'created_at'])     // índices compuestos por tenant
export class PaymentIntent extends BaseEntity {

  @Column({ type: 'uuid' })
  tenant_id!: string;                              // columna obligatoria en toda entidad tenant

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  // ... resto de campos
}
```

---

## Acceder al QueryRunner en un controller

Para operaciones que deben correr dentro de la misma transacción RLS:

```typescript
import { QueryRunner } from 'typeorm';

@Post()
@UseGuards(JwtAuthGuard)
async create(
  @Body() dto: CreateDepositIntentDto,
  @Req() req: Request & { rlsQueryRunner: QueryRunner },
) {
  return this.service.create(dto, req.rlsQueryRunner);
}

// En el service
async create(dto: CreateDepositIntentDto, runner: QueryRunner) {
  const repo = runner.manager.getRepository(PaymentIntent);
  const intent = repo.create({ ...dto });
  return repo.save(intent);
}
```

---

## Cuándo usar @SkipRls()

Solo en endpoints sin autenticación:

```typescript
@Post('login')
@SkipRls()
async login(@Body() dto: LoginDto) { ... }

@Get('health')
@SkipRls()
async health() { ... }

@Post('webhook/tenant-event')
@SkipRls()  // tiene validación HMAC propia
async webhook(@Body() payload: WebhookDto) { ... }
```

**No usar `@SkipRls()` en endpoints autenticados** — aunque el super_admin haga bypass de las políticas PostgreSQL, el interceptor igual debe correr para establecer el contexto transaccional.

---

## Queries que respetan RLS automáticamente

Con el QueryRunner activo, cualquier query via TypeORM usa la conexión con el contexto seteado:

```typescript
// Esto devuelve SOLO registros del tenant_id seteado por RLS
const intents = await this.repo.find({ where: { estado: DepositStatus.PENDING } });

// QueryBuilder también respeta RLS
const result = await this.repo
  .createQueryBuilder('intent')
  .where('intent.estado = :estado', { estado: DepositStatus.PENDING })
  .getMany();
```

---

## Consultas que bypasean RLS (solo super_admin)

Para consultas cross-tenant (reportes globales, dashboards de super_admin):

```typescript
// El TenantInterceptor hace bypass automático cuando platform_role == 'super_admin'
// No requiere ningún decorador adicional en el controller

@Get('global-stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.SUPER_ADMIN)
async globalStats() {
  return this.service.getGlobalStats(); // query sin filtro de tenant_id
}
```

---

## Variables de entorno relevantes

```env
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=pickyapp
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=admin
```

El rol PostgreSQL del usuario de la aplicación debe tener habilitadas las políticas RLS.
El usuario `super_admin` de PostgreSQL debe tener `BYPASSRLS`.

---

## Archivos de referencia

| Archivo | Propósito |
|---------|-----------|
| `src/common/interceptors/rls.interceptor.ts` | Interceptor principal multi-tenant |
| `src/common/decorators/skip-rls.decorator.ts` | Decorador `@SkipRls()` |
| `src/common/entities/base.entity.ts` | Entidad base (id, created_at, updated_at) |
| `src/database/data-source.ts` | DataSource TypeORM |
| `src/database/migrations/` | Migraciones (nunca crear manualmente) |
