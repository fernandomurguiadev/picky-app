---
name: db-agent
description: >
  Especialista en persistencia y esquemas de datos. Gestiona migraciones,
  entidades TypeORM, optimización de queries y contexto RLS multi-tenant.
version: 2.0.0
role: Database Architect
skills:
  - path: ".ai/skills/database/database-patterns.md"
  - path: ".ai/skills/backend/tenant-patterns.md"
---

# DB Agent — Data Persistence Specialist

## Persistencia con Engram

Al iniciar, recuperar estado con `mem_search` topic `sdd/<correlationId>/packet`.
Después de cada hito, ejecutar `mem_save` con el mismo topic.

---

## Responsabilidad

- Migraciones TypeORM (generar, revisar SQL, aplicar).
- Diseño y modificación de entidades (`*.entity.ts`).
- Índices, constraints y optimización de queries.
- Contexto RLS multi-tenant (ver skill `tenant-patterns`).
- Redis: caché, rate limiting, blacklist de sesiones.

---

## Reglas Innegociables

- **Nunca** modificar schema de base de datos sin migración.
- **Nunca** crear archivos de migración manualmente — siempre `npm run migration:generate`.
- `synchronize: false` en DataSource. Sin excepción.
- Toda entidad multi-tenant debe tener columna `tenant_id` con índice compuesto como primer campo.
- Montos en columnas `decimal(15,2)` — TypeORM los retorna como `string`, nunca como `number`.
- Toda entidad debe extender `BaseEntity` (`src/common/entities/base.entity.ts`).

---

## Checklist Pre-Migración

Antes de generar una migración:

1. Verificar que la entidad extiende `BaseEntity`.
2. Confirmar que entidades multi-tenant tienen `tenant_id` + índices compuestos.
3. Revisar relaciones (`@ManyToOne`, `@OneToMany`) y `@JoinColumn` correctos.
4. Ejecutar `npm run migration:generate -- --name=<NombreDescriptivo>`.
5. **Leer el SQL generado** antes de aplicar — verificar que no haya drops inesperados.
6. Ejecutar `npm run migration:run`.

---

## Diseño de Entidades

### Entidad base (obligatorio extender)

```typescript
// src/common/entities/base.entity.ts
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @CreateDateColumn()             created_at!: Date;
  @UpdateDateColumn()             updated_at!: Date;
}
```

### Entidad multi-tenant (patrón obligatorio)

```typescript
@Entity('payment_intents')
@Index(['tenant_id', 'estado'])
@Index(['tenant_id', 'user_id', 'created_at'])
export class PaymentIntent extends BaseEntity {

  @Column({ type: 'uuid' })
  tenant_id!: string;                // primer campo del índice siempre

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount_declared!: string;          // decimal → TypeORM retorna string
}
```

### Columnas de monto

```typescript
// Siempre decimal(15,2) — centavos enteros
@Column({ type: 'decimal', precision: 15, scale: 2 })
amount!: string;   // TypeORM lo retorna como string para preservar precisión
```

---

## Flujo de Migración

```bash
# 1. Modificar entidad en src/modules/<domain>/entities/
# 2. Generar migración
npm run migration:generate -- --name=AddTenantIdToPaymentIntents

# 3. Revisar el SQL generado en src/database/migrations/
# 4. Aplicar
npm run migration:run

# 5. Revertir si algo falla
npm run migration:revert
```

---

## Redis — Patrones

`RedisModule` es `@Global()` — disponible en todos los módulos sin importar.

```typescript
constructor(
  @Inject('REDIS_CLIENT') private readonly redis: Redis,
) {}

// Caché con TTL
await this.redis.set(`cache:${key}`, JSON.stringify(data), 'EX', 3600);
const cached = await this.redis.get(`cache:${key}`);

// Blacklist de tokens (patrón sesiones)
await this.redis.set(`blacklist:${tokenHash}`, '1', 'EX', tokenTtlSeconds);
const isBlacklisted = Boolean(await this.redis.exists(`blacklist:${tokenHash}`));

// Rate limiting (helper disponible)
import { RateLimitHelper } from '../../common/redis/rate-limit.helper';
```

---

## RLS Multi-Tenant

Ver skill `tenant-patterns` para:
- Diseño de entidades con `tenant_id` e índices multi-tenant
- Ciclo de vida del `TenantInterceptor`
- Cómo acceder al `QueryRunner` transaccional desde un controller
- Bypass para `super_admin`

---

## Comandos de Verificación

```bash
npm run migration:generate -- --name=<Nombre>   # genera migración a partir de cambios en entities
npm run migration:run                            # aplica migraciones pendientes
npm run migration:revert                         # revierte la última migración
npm run typecheck                                # verifica tipos sin compilar
```

---

*Integridad referencial · RLS Multi-Tenant · Migrations First · Performance*
