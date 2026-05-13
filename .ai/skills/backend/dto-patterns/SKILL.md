---
name: dto-patterns
description: Patrones para crear y mejorar DTOs en PickyApp — Swagger, class-validator, class-transformer y reglas financieras.
version: "1.0"
source: openspec/skills/ (versioned, IDE-agnostic)
last_reviewed: 2026-04-27
used_by:
  - backend-agent  # toda creación o modificación de DTOs de request/response
---

# DTO Patterns — PickyApp

Guía de referencia para crear DTOs en NestJS dentro del proyecto PickyApp.

---

## Regla fundamental

**Todo campo de un DTO debe tener `@ApiProperty`**, sin excepción.
Sin él, Swagger genera documentación vacía o incorrecta para ese endpoint.

---

## Response DTOs vs Request DTOs

| Aspecto | Response DTO | Request DTO (body/query) |
|---------|-------------|--------------------------|
| `@ApiProperty` | ✅ Siempre | ✅ Siempre |
| `class-validator` | ❌ No aplica | ✅ Requerido |
| `class-transformer` | ❌ Raramente | ✅ Solo si hay conversión de tipos |
| Ejemplo de clase | `*ResponseDto`, `*ListItemDto`, `*DetailDto` | `Create*Dto`, `Update*Dto` |

---

## Response DTO — Ejemplo completo

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { DepositStatus } from '../../../common/enums';

export class DepositIntentDetailDto {
  @ApiProperty({ description: 'Identificador único de la intención', example: 'utid_abc123' })
  utid!: string;

  @ApiProperty({ description: 'Estado actual', enum: DepositStatus })
  status!: DepositStatus;

  @ApiProperty({ description: 'Monto declarado en centavos', example: '10000' })
  amount_declared!: string;

  @ApiProperty({ description: 'CBU destino', nullable: true, required: false, example: '0000003100012345678901' })
  destination_account_cbu?: string | null;
}
```

---

## Request DTO — Ejemplo completo

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDepositIntentDto {
  // Campo string requerido
  @ApiProperty({ description: 'Moneda del depósito', example: 'ARS' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  // Campo number que llega como number en el JSON
  @ApiProperty({ description: 'Monto en centavos', example: 10000 })
  @IsInt()
  @IsNotEmpty()
  amount!: number;
}
```

---

## Reglas de `class-validator`

### `@IsNotEmpty()`
- Campo **requerido**: no puede ser `undefined`, `null` ni cadena vacía `""`.
- Con este decorador activo, el `!` sigue siendo correcto para TypeScript strict mode.

### `@IsString()`
- Valida que el valor recibido en el JSON **es de tipo string**.
- Rechaza `123` (number), `true` (boolean). Solo acepta `"123"`.
- Usar siempre en campos string de request DTOs.

### `@IsNumber()` / `@IsInt()`
- Valida que el valor recibido **es de tipo number**.
- Rechaza `"123"` (string). Solo acepta `123`.
- Usar `@IsInt()` para campos sin decimales (montos, IDs enteros).

---

## `class-transformer` — Solo cuando el contrato externo lo requiere

Cuando un cliente envía un campo como string (`"10000"`) pero la lógica de negocio necesita un number, usar `@Transform` para convertir **antes** de validar:

```typescript
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

// JSON llega: { "amount": "10000" }  ← string (ej: form-data, query param, legacy)
@ApiProperty({ description: 'Monto en centavos', example: 10000 })
@Transform(({ value }) => Number(value))
@IsInt()
@IsNotEmpty()
amount!: number;
// Controlador recibe: amount = 10000  (number)
```

**No usar `@Transform` si el cliente ya envía el tipo correcto** — agregar transformaciones innecesarias complica el debugging.

Requiere `ValidationPipe` con `transform: true` en `main.ts` (ya configurado en PickyApp).

---

## Campos opcionales y nullable

```typescript
// Opcional y puede ser null
@ApiProperty({ description: 'Alias bancario', nullable: true, required: false, example: null })
destination_alias?: string | null;

// Opcional pero nunca null
@ApiProperty({ description: 'URL del comprobante', required: false, example: 'https://...' })
receipt_url?: string;
```

- `nullable: true` → el campo puede ser `null`.
- `required: false` → el campo puede estar ausente en la respuesta/body.

---

## Enums en Swagger

```typescript
import { DepositStatus } from '../../../common/enums';

@ApiProperty({ description: 'Estado de la intención', enum: DepositStatus })
status!: DepositStatus;
```

Swagger genera el esquema con los valores posibles del enum. **No usar `type: string`** cuando existe el enum.

---

## Reglas financieras de PickyApp

- Los montos **siempre se representan en centavos** (enteros).
- En lógica de negocio: `number` entero (`@IsInt()`).
- En response DTOs hacia el FE: pueden exponerse como `string` si el contrato lo requiere (para evitar pérdida de precisión en JavaScript).
- **Nunca usar `float`** para montos. Nunca `@IsNumber({ allowedTypes: 'float' })`.

---

## Instalación por IDE

| IDE | Destino |
|-----|---------|
| **Claude Code** | `.claude/skills/dto-patterns/SKILL.md` |
| **Trae** | `.trae/skills/dto-patterns/SKILL.md` |
| **Cursor** | `.cursor/rules/dto-patterns.mdc` |
