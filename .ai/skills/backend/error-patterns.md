---
name: error-patterns
description: >
  Patrones de manejo de errores tipados en PickyApp API.
  BusinessException, catálogos de errores por dominio, CommonErrors y
  formato de respuesta estandarizado del GlobalExceptionFilter.
version: "1.0"
used_by:
  - backend-agent  # toda implementación de lógica de negocio
last_reviewed: 2026-05-05
---

# Error Patterns — PickyApp API

## Regla fundamental

**Nunca** usar `throw new Error('mensaje')` suelto.
**Siempre** usar `BusinessException` con un `ErrorDefinition` tipado del catálogo del dominio.

---

## Estructura de un catálogo de errores

Cada módulo tiene su propio catálogo en `src/modules/<domain>/errors/`:

```
src/modules/<domain>/errors/
├── <domain>.error-codes.ts    # string constants
└── <domain>.errors.ts         # fábrica de ErrorDefinition
```

### 1. Error codes (string constants)

```typescript
// src/modules/deposits/errors/deposit.error-codes.ts
export const DepositErrorCodes = {
  INTENT_NOT_FOUND:       'DEPOSIT.INTENT_NOT_FOUND',
  INVALID_AMOUNT:         'DEPOSIT.INVALID_AMOUNT',
  EXPIRED:                'DEPOSIT.EXPIRED',
  ALREADY_MATCHED:        'DEPOSIT.ALREADY_MATCHED',
  DESTINATION_UNAVAILABLE:'DEPOSIT.DESTINATION_UNAVAILABLE',
} as const;
```

**Convención de naming**: `<DOMAIN>.<SNAKE_CASE_REASON>`

### 2. Fábrica de errores (ErrorDefinition)

```typescript
// src/modules/deposits/errors/deposit.errors.ts
import { HttpStatus } from '@nestjs/common';
import { ErrorDefinition } from '../../common/errors/error-definition';
import { DepositErrorCodes } from './deposit.error-codes';

export const DepositErrors = {
  intentNotFound(id: string): ErrorDefinition {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      code: DepositErrorCodes.INTENT_NOT_FOUND,
      message: `Deposit intent ${id} not found`,
    };
  },

  invalidAmount(amount: number): ErrorDefinition {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      code: DepositErrorCodes.INVALID_AMOUNT,
      message: 'Amount must be a positive integer in cents',
      details: { received: amount },
    };
  },

  expired(id: string, expiredAt: Date): ErrorDefinition {
    return {
      statusCode: HttpStatus.CONFLICT,
      code: DepositErrorCodes.EXPIRED,
      message: `Deposit intent ${id} has expired`,
      details: { expired_at: expiredAt.toISOString() },
    };
  },
};
```

### 3. Lanzar en el servicio

```typescript
// src/modules/deposits/services/deposit-intents.service.ts
import { toBusinessException } from '../../../common/errors/business.exception';
import { DepositErrors } from '../errors/deposit.errors';

@Injectable()
export class DepositIntentsService {
  async findById(id: string, tenantId: string): Promise<PaymentIntent> {
    const intent = await this.repo.findOne({ where: { id, tenant_id: tenantId } });

    if (!intent) {
      throw toBusinessException(DepositErrors.intentNotFound(id));
    }

    if (intent.estado === DepositStatus.EXPIRED) {
      throw toBusinessException(DepositErrors.expired(id, intent.updated_at));
    }

    return intent;
  }
}
```

---

## Errores comunes reutilizables (CommonErrors)

Para errores genéricos que no pertenecen a un dominio específico:

```typescript
import { CommonErrors } from '../../../common/errors/common.errors';
import { toBusinessException } from '../../../common/errors/business.exception';

// Entidad no encontrada
throw toBusinessException(CommonErrors.notFound('Tenant', { id: tenantId }));

// Conflicto (ej: registro duplicado)
throw toBusinessException(CommonErrors.conflict('Email already registered'));

// Prohibido (permisos insuficientes)
throw toBusinessException(CommonErrors.forbidden('Cannot access this tenant'));

// Error interno (usar con moderación, preferir errores tipados)
throw toBusinessException(CommonErrors.internal({ context: 'upload failed' }));
```

**Códigos generados**:
```
COMMON.NOT_FOUND
COMMON.CONFLICT
COMMON.FORBIDDEN
COMMON.INTERNAL_ERROR
COMMON.VALIDATION_FAILED
```

---

## Respuesta de error estandarizada (GlobalExceptionFilter)

El `GlobalExceptionFilter` en `src/common/errors/global-exception.filter.ts` intercepta todas las excepciones y devuelve este formato:

```json
{
  "success": false,
  "timestamp": "2026-05-05T10:14:30.000Z",
  "path": "/api/v1/deposits/intents/abc-123",
  "method": "GET",
  "statusCode": 404,
  "code": "DEPOSIT.INTENT_NOT_FOUND",
  "message": "Deposit intent abc-123 not found",
  "details": null
}
```

### Casos que maneja automáticamente

| Situación | HTTP | Código |
|-----------|------|--------|
| `BusinessException` | El definido en ErrorDefinition | El código del catálogo |
| `ValidationPipe` falla | 400 | `COMMON.VALIDATION_FAILED` |
| TypeORM unique constraint (23505) | 409 | `COMMON.CONFLICT` |
| `UnauthorizedException` | 401 | Mensaje de Passport |
| `ForbiddenException` | 403 | El mensaje del guard |
| Cualquier Error no manejado | 500 | `COMMON.INTERNAL_ERROR` |

---

## Qué no incluir en los errores

- **No loguear PII**: nunca poner emails, CBU, contraseñas, tokens en `details` o `message`
- **No exponer stacktraces** en producción (`NODE_ENV=production` los oculta automáticamente)
- **No usar `details` para información sensible** — solo datos que el cliente necesita para corregir su request

---

## Archivos de referencia

| Archivo | Propósito |
|---------|-----------|
| `src/common/errors/business.exception.ts` | Clase + `toBusinessException()` helper |
| `src/common/errors/error-definition.ts` | Tipo `ErrorDefinition` |
| `src/common/errors/common.errors.ts` | Catálogo de errores reutilizables |
| `src/common/errors/common.errors.ts` | `CommonErrorCodes` string constants |
| `src/common/errors/global-exception.filter.ts` | Filtro global — formato de respuesta |
| `src/modules/auth/errors/auth.errors.ts` | Ejemplo de catálogo de dominio |
| `src/modules/deposits/errors/` | Ejemplo de catálogo de dominio |
