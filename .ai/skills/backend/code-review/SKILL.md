---
name: code-review
description: >
  Code review exhaustivo para api. Verifica arquitectura hexagonal,
  DTOs, entidades TypeORM, auth/guards, RLS multi-tenant, manejo de errores,
  seguridad financiera, tests y calidad general de código NestJS.
version: "1.0"
used_by:
  - backend-agent
invoke: /backend:review
---

# Code Review — Backend (api)

Skill para revisar código en `api` con conocimiento completo del stack:
NestJS + arquitectura hexagonal + RLS multi-tenant + JWT RS256 + TypeORM + Bull.

## Cómo ejecutar la review

Recibís un input: puede ser un archivo, un módulo, un PR diff, o una descripción de cambio.

1. **Identificar scope**: qué archivos/capas están involucrados (entity, dto, service, controller, module, test)
2. **Leer los archivos en orden**: entity → dto → service → controller → module → tests
3. **Aplicar cada checklist** según las capas presentes
4. **Reportar hallazgos** en el formato estructurado definido al final

---

## Checklist por Capa

### 1. Entidades TypeORM (`entities/*.entity.ts`)

```
[ ] Extiende BaseEntity (id uuid, created_at, updated_at)
[ ] Toda entidad multi-tenant tiene columna tenant_id (uuid, @Column, @Index)
[ ] Índices compuestos siempre con tenant_id PRIMERO: @Index(['tenant_id', 'otro_campo'])
[ ] Campos monetarios como decimal(15,2) en DB → string en TypeScript (nunca number/float)
[ ] Relaciones con @ManyToOne / @JoinColumn correctamente definidas
[ ] Enums tipados (no strings mágicos)
[ ] Campos JSON sensibles como jsonb (ocr_response, device_fingerprint, risk_factors)
[ ] Timestamps de negocio separados de created_at/updated_at (ej: validated_at, expired_at)
[ ] Nombre de entidad en PascalCase, tabla en snake_case pluralizada
[ ] synchronize: false en toda la configuración TypeORM (verificar en database.config.ts)
```

**Señales de alerta:**
- `@Column({ type: 'float' })` → debe ser `decimal(15,2)` para montos
- Entidad sin `tenant_id` cuando el módulo es multi-tenant
- Índice sin `tenant_id` como primer campo

---

### 2. DTOs (`dto/*.dto.ts`)

```
[ ] Todo campo de Request DTO tiene @ApiProperty + decorador de class-validator
[ ] Todo campo de Response DTO tiene @ApiProperty (al menos description + example)
[ ] Montos monetarios: @IsInt() + @ApiProperty({ example: 10000, description: 'En centavos' })
[ ] Enums: enum: MyEnum en @ApiProperty, @IsEnum(MyEnum) en request DTOs
[ ] Campos opcionales marcados: @ApiProperty({ required: false }) + @IsOptional()
[ ] Campos nullables: @ApiProperty({ nullable: true }) + @IsOptional() + tipo | null
[ ] No usar @Transform innecesario — solo si el cliente envía un tipo incorrecto (ej: form-data)
[ ] Response DTOs no tienen decoradores de class-validator (son solo contratos de salida)
[ ] Nombres en camelCase, archivos en kebab-case
[ ] No exponer campos internos (tenant_id interno, hashes, tokens, claves)
```

**Señales de alerta:**
- `amount: number` sin `@IsInt()` → puede aceptar floats
- Campo sin `@ApiProperty` → Swagger desactualizado
- Response DTO con `@IsString()` → innecesario y confuso

---

### 3. Servicios (`services/*.service.ts`)

```
[ ] Toda la lógica de negocio vive aquí, no en controllers
[ ] Repositorios inyectados via constructor (@InjectRepository)
[ ] Transacciones ACID con dataSource.transaction() o QueryRunner para operaciones multi-tabla
[ ] Errores de negocio lanzan BusinessException desde catálogo del dominio
[ ] Nunca throw new Error('mensaje') suelto
[ ] Nunca throw new HttpException() directamente — usar fábrica de errores tipados
[ ] Integración con servicios externos (TenantClientFactory, etc.) aislada en métodos privados
[ ] Métodos públicos = entrada del dominio (casos de uso); métodos privados = utilidades internas
[ ] No loguear PII: emails, CBUs, contraseñas, tokens, device fingerprints completos
[ ] Montos manejados en centavos enteros durante todo el procesamiento
[ ] Idempotencia considerada para operaciones críticas (depósitos, retiros, créditos)
[ ] Webhooks y notificaciones disparados de forma no bloqueante (no await en fanout)
[ ] Al trabajar con QueryRunner pasado desde TenantInterceptor: usar runner.manager.getRepository()
```

**Señales de alerta:**
- `this.someRepo.findOne()` dentro de un bloque `dataSource.transaction()` sin usar el manager → rompe transacción
- `parseFloat(amount)` o `Number(amount)` para montos → pérdida de precisión
- `console.log(user.email)` → PII leak
- Llamada a API externa dentro de una transacción → riesgo de deadlock

---

### 4. Controllers (`controllers/*.controller.ts`)

```
[ ] El controller NO contiene lógica de negocio — solo orquestación
[ ] JwtAuthGuard presente en todos los endpoints autenticados
[ ] RolesGuard + @Roles() para endpoints con restricción de rol
[ ] RequireTenantContextGuard para endpoints que requieren tenant_id en el JWT
[ ] @SkipRls() solo en endpoints verdaderamente públicos (login, health, webhooks entrantes)
[ ] @CurrentUser() para extraer JwtPayload (no req.user manualmente)
[ ] @CurrentTenant() para extraer tenant_id cuando corresponda
[ ] Metadata extraída del request (IP, fingerprint) en el controller — no en el service
[ ] @ApiTags, @ApiOperation, @ApiResponse documentados en Swagger
[ ] HTTP status codes correctos: 201 para creación, 200 para lectura, 204 para delete sin body
[ ] @HttpCode() explícito cuando no es 200 por defecto
[ ] ParseUUIDPipe en @Param() cuando el parámetro es UUID
[ ] Nombre del controller refleja el rol: PlayerDepositIntentsController, AdminDepositsController
```

**Señales de alerta:**
- Lógica condicional en el controller → mover al service
- Guards faltantes en endpoint sensible
- `@SkipRls()` en endpoint que requiere autenticación → vulnerabilidad RLS

---

### 5. Módulo (`*.module.ts`)

```
[ ] TypeOrmModule.forFeature([...]) registra todas las entidades del módulo
[ ] Todos los services del módulo están en providers: []
[ ] Módulos externos importados correctamente (no reimplementar lo que exporta otro módulo)
[ ] Solo exportar services que otros módulos realmente consumen
[ ] Bull queues registradas con BullModule.registerQueue({ name: '...' })
[ ] No circular dependencies — si las hay, usar forwardRef() con justificación
[ ] Módulos de infraestructura (Mail, Webhook, Notifications) importados, no reimplementados
```

**Señales de alerta:**
- Service que usa entidades de otro módulo sin importar ese módulo
- Exports: [] con muchos items innecesarios → viola encapsulamiento

---

### 6. Manejo de Errores (`errors/*.errors.ts`, `errors/*.error-codes.ts`)

```
[ ] Catálogo de errores existe en src/modules/<domain>/errors/
[ ] Códigos en formato DOMAIN.SNAKE_CASE_REASON (ej: WITHDRAWAL.INSUFFICIENT_BALANCE)
[ ] Fábrica de errores retorna HttpException tipada (NotFoundException, UnprocessableEntityException, etc.)
[ ] Mensajes de error en español, orientados al usuario (no stack traces, no paths internos)
[ ] BusinessException usada consistentemente — nunca excepciones nativas de Node sueltas
[ ] CommonErrors reutilizados para casos genéricos (notFound, conflict, forbidden, internal)
[ ] details solo incluye info que el cliente puede usar — nunca paths, queries SQL, o tokens
[ ] GlobalExceptionFilter maneja todos los casos — no agregar try/catch defensivos innecesarios
```

**Señales de alerta:**
- `throw new Error('User not found')` → debe ser `throw UserErrors.notFound(id)`
- `throw new HttpException({ message: 'error' }, 422)` → usar fábrica tipada
- Código de error como `'error'` o `'unknown'` → debe ser específico y rastreable

---

### 7. Auth & Seguridad (`auth/`, guards, JWT)

```
[ ] Tokens JWT nunca almacenados en localStorage — cookies httpOnly vía BFF
[ ] JwtPayload tipado usado en toda la codebase (no any para req.user)
[ ] platform_role validado con enum PlatformRole (no string literals)
[ ] tenant_id validado como UUID antes de usarlo en queries
[ ] Fingerprint procesado en el guard — no accedido directamente en services
[ ] RS256 configurado en jwt.config.ts — no HS256
[ ] Refresh tokens con TTL diferente a access tokens
[ ] Blacklist de tokens verificada en JwtAuthGuard (Redis session_blacklist)
[ ] Claves privadas/públicas referenciadas desde vault o env — nunca hardcodeadas
[ ] No exponer jti, iat, exp en response DTOs
```

**Señales de alerta:**
- `res.cookie('token', ...)` sin `httpOnly: true` → XSS vulnerability
- `(req.user as any).tenant_id` → usar JwtPayload tipado
- Clave JWT hardcodeada en config → vulnerability crítica

---

### 8. RLS Multi-Tenant

```
[ ] Toda entidad multi-tenant tiene tenant_id como primer campo en índices compuestos
[ ] TenantInterceptor aplica para todos los endpoints autenticados (no SkipRls accidentalmente)
[ ] QueryRunner del TenantInterceptor pasado al service cuando las queries deben estar bajo RLS
[ ] En service: runner.manager.getRepository(Entity) — no this.repo dentro de una transacción RLS
[ ] super_admin bypasea RLS correctamente — verificado en TenantInterceptor
[ ] Endpoints de reportes globales (super_admin) usan DataSource directamente, no el runner de RLS
[ ] No hay queries que filtren tenant_id manualmente cuando RLS ya lo hace (double filtering ok, pero innecesario)
```

**Señales de alerta:**
- Service que recibe QueryRunner pero usa `this.entityRepo` → no respeta RLS
- Endpoint de tenant que no tiene RequireTenantContextGuard → tenant_id puede ser null

---

### 9. Tests (`tests/unit/`, `tests/integration/`)

```
[ ] Unit tests para toda lógica de negocio en services
[ ] Tests de casos happy path Y casos de error (BusinessException esperada)
[ ] Repositorios mockeados con jest.Mocked<Repository<Entity>>
[ ] No mockear la base de datos en integration tests — usar TestContainers o DB de test real
[ ] Integration tests verifican pipeline completo (auth → guard → controller → service)
[ ] Test de endpoint sin auth retorna 401
[ ] Test de endpoint con rol incorrecto retorna 403
[ ] Test de validación de DTO retorna 400 con código COMMON.VALIDATION_FAILED
[ ] No usar any en los tests — tipado estricto igual que en producción
[ ] describe() anidados por caso de uso, no por método
[ ] Nombres de tests en formato: 'lanza/retorna/llama X cuando Y'
```

**Señales de alerta:**
- Test que solo verifica que no lanza (`expect(() => fn()).not.toThrow()`) sin verificar el resultado
- Mock de DataSource que simula transacciones → puede ocultar bugs de concurrencia
- `jest.mock()` de módulos enteros → demasiado permisivo, mejor mock granular

---

### 10. Performance & Queries TypeORM

```
[ ] findOne con relaciones usa { relations: [...] } o QueryBuilder con leftJoinAndSelect
[ ] Listas paginadas: skip + take con total count (no cargar todo y luego slice)
[ ] Índices definidos para campos usados frecuentemente en WHERE + tenant_id
[ ] No N+1: relaciones cargadas en la misma query cuando siempre se necesitan
[ ] QueryBuilder usado para queries complejas con múltiples joins o condiciones dinámicas
[ ] update() de TypeORM preferido sobre save() para actualizaciones parciales (evita re-insert)
[ ] Campos SELECT explícitos en queries que retornan muchas filas (no SELECT *)
[ ] Bull queues para operaciones asíncronas de larga duración (no bloquear request cycle)
```

**Señales de alerta:**
- Loop con `await repo.findOne()` dentro → N+1
- `await repo.find()` en colección grande sin paginación → OOM risk
- `save()` para solo actualizar un campo → trae toda la entidad y re-serializa

---

## Formato de Reporte de Review

Al finalizar la revisión, reportar con esta estructura:

```markdown
## Code Review — [nombre del módulo/archivo]

### Resumen
- **Capa(s) revisada(s)**: [entity / dto / service / controller / module / tests]
- **Veredicto**: ✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Requiere cambios

---

### Hallazgos

#### 🔴 Bloqueantes (deben resolverse antes de mergear)
- **[ARCHIVO:LÍNEA]** — Descripción del problema + impacto + fix recomendado

#### 🟡 Observaciones (mejoras recomendadas)
- **[ARCHIVO:LÍNEA]** — Descripción + sugerencia

#### 🟢 Bien hecho
- [Aspecto positivo que vale la pena destacar]

---

### Checklist de Compliance

| Área | Estado | Notas |
|------|--------|-------|
| Arquitectura hexagonal | ✅ / ⚠️ / ❌ | |
| DTOs con @ApiProperty | ✅ / ⚠️ / ❌ | |
| Montos en centavos | ✅ / ⚠️ / ❌ | |
| Auth & Guards | ✅ / ⚠️ / ❌ | |
| RLS multi-tenant | ✅ / ⚠️ / ❌ | |
| Error handling tipado | ✅ / ⚠️ / ❌ | |
| Sin PII en logs | ✅ / ⚠️ / ❌ | |
| Tests presentes | ✅ / ⚠️ / ❌ | |
| TypeORM (synchronize:false, índices) | ✅ / ⚠️ / ❌ | |

---

### Acciones requeridas
1. [ ] Acción concreta con archivo y línea
2. [ ] ...
```

---

## Referencias cruzadas

| Área | Skill de referencia |
|------|-------------------|
| DTOs | `.ai/skills/backend/dto-patterns/SKILL.md` |
| Auth & Guards | `.ai/skills/backend/auth-patterns.md` |
| RLS | `.ai/skills/backend/tenant-patterns.md` |
| Errores | `.ai/skills/backend/error-patterns.md` |
| NestJS general | `.ai/skills/backend/nest-development.md` |
| Migraciones / entidades | `.ai/agents/db-agent.md` → `@db-agent` |

---

## Instalación por IDE

### Claude Code
Copiar `SKILL.md` a `.claude/skills/code-review/SKILL.md`.  
Invocar con: `/backend:review`

### Trae
Copiar a `.trae/skills/code-review/SKILL.md`

### Cursor
Copiar contenido como sección en `.cursor/rules/backend-review.mdc`

---

*Code Review Skill · Backend Agent v1.0 · api*
