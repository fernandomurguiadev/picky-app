# Skill: Crear Nuevo Hook (TanStack Query)

## Descripción
Esta skill guía la creación de hooks de TanStack Query (queries y mutations) siguiendo las convenciones del proyecto PickyApp.

## Principios

1. **No duplicar lógica de fetch**. Encapsular toda lógica de servidor en hooks.
2. **Factory functions para query keys**. Usar `depositQueryKeys` o crear factory functions locales para garantizar consistencia.
3. **Tipado estricto con `DepositError`**. Toda mutation que consuma la API del backend debe usar el tipo `DepositError` (con `code` y `status`).
4. **Invalidación selectiva**. Invalidar solo las queries necesarias, no todo el cache.
5. **Polling callbacks para UX no-bloqueante**. Patrón documentado en `openspec/specs/polling-strategy.md`.

---

## Estructura de un Hook de Mutation

### Archivo: `hooks/{modulo}/use-{accion}.ts`

```typescript
/**
 * @file use-{accion}.ts
 * @description Hook mutation para {descripción}.
 *
 * Consume `{METHOD} /api/backend/api/v1/{ruta}`.
 * El BFF proxy inyecta el JWT desde la cookie httpOnly.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { depositQueryKeys } from '@/lib/{modulo}/query-keys';
import type { DepositIntentDetail, DepositError } from '@/types/{modulo}';

export type {Accion}Args = {
  /** UTID o identificador de la entidad */
  utid: string;
  /** Otros argumentos específicos */
};

async function post{Accion}(args: {Accion}Args): Promise<ReturnType> {
  const { utid } = args;

  const res = await fetch(`/api/backend/api/v1/{ruta}/${utid}`, {
    method: 'POST',
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(
      data.message ?? 'Error al {accion}',
    ) as DepositError;
    error.code = data.code;
    error.status = res.status;
    throw error;
  }

  return data as ReturnType;
}

/**
 * Hook mutation para {descripción}.
 *
 * Errores conocidos del backend:
 * - `{CODE}` ({status}) — {descripción}
 *
 * @returns `{ mutate, isPending, error, reset }`
 *
 * @example
 * const { mutate, isPending } = use{Accion}();
 * mutate({ utid: 'LX-A3F7K2PQ' });
 */
export function use{Accion}() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ReturnType, DepositError, {Accion}Args>({
    mutationFn: post{Accion},
    onSuccess: (_data, { utid }) => {
      queryClient.invalidateQueries({ queryKey: depositQueryKeys.intentDetail(utid) });
      queryClient.invalidateQueries({ queryKey: depositQueryKeys.intents() });
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
```

---

## Estructura de un Hook de Query con Polling

### Archivo: `hooks/{modulo}/use-{entidad}-detail.ts`

```typescript
/**
 * @file use-{entidad}-detail.ts
 * @description Hook de consulta para {descripción}.
 *
 * Consume `GET /api/backend/api/v1/{ruta}/:id`.
 * Soporta polling condicional para UX no-bloqueante (ver polling-strategy.md).
 */

import { useQuery } from '@tanstack/react-query';
import type { Query } from '@tanstack/react-query';
import { depositQueryKeys } from '@/lib/{modulo}/query-keys';
import type { DepositIntentDetail, DepositError } from '@/types/{modulo}';

async function fetch{Entity}Detail(utid: string): Promise<ReturnType> {
  const res = await fetch(`/api/backend/api/v1/{ruta}/${utid}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(
      data.message ?? 'Error al obtener el detalle',
    ) as DepositError;
    error.code = data.code;
    error.status = res.status;
    throw error;
  }

  return data as ReturnType;
}

export type RefetchIntervalFn = (
  query: Query<ReturnType, DepositError>,
) => number | false | undefined;

export type Use{Entity}DetailOptions = {
  /**
   * Intervalo de polling. Acepta número (ms), `false` para desactivar,
   * o callback dinámico. Usar callback cuando el intervalo depende de los datos.
   */
  refetchInterval?: number | false | RefetchIntervalFn;
  /**
   * Datos iniciales para hidratación desde Server Component.
   * Evita el loading state en la primera renderización.
   */
  initialData?: ReturnType;
};

/**
 * Hook para obtener el detalle de {entidad}.
 *
 * `staleTime: 0` garantiza revalidación al montar.
 * Polling condicional para UX no-bloqueante.
 *
 * @param utid - Identificador único
 * @param options - Opciones de polling e hidratación
 * @returns `{ data, isLoading, isError, error }`
 *
 * @example
 * // Polling activo mientras no hay cuenta asignada
 * const isWaiting = data?.status === 'pending_payment' && !data?.has_destination_account;
 * const { data } = use{Entity}Detail(utid, {
 *   refetchInterval: isWaiting ? 5_000 : false,
 * });
 */
export function use{Entity}Detail(
  utid: string,
  options: Use{Entity}DetailOptions = {},
) {
  const { refetchInterval = false, initialData } = options;

  const query = useQuery<ReturnType, DepositError>({
    queryKey: depositQueryKeys.detail(utid),
    queryFn: () => fetch{Entity}Detail(utid),
    staleTime: 0,
    refetchInterval,
    initialData,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
```

---

## Query Keys Factory

Siempre centralizar las keys en `lib/{modulo}/query-keys.ts`:

```typescript
export const depositQueryKeys = {
  all: ['deposits'] as const,
  intents: () => [...depositQueryKeys.all, 'intents'] as const,
  intentsList: (params = {}) => [...depositQueryKeys.intents(), 'list', params] as const,
  intentDetail: (utid: string) => [...depositQueryKeys.intents(), 'detail', utid] as const,
};
```

## Tipado de Errores

Usar el tipo `DepositError` exportado desde `@/types/{modulo}`:

```typescript
export type DepositError = Error & {
  code?: string;
  status?: number;
};
```

Este tipo se aplica tanto a mutations (con `onError`) como a queries (con `error`).