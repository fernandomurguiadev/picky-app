# Skill: Crear Formulario (React Hook Form + Zod)

## Descripción
Esta skill guía la creación de formularios con React Hook Form y Zod, siguiendo las convenciones del proyecto PickyApp (traducciones, manejo de errores del backend por código, validaciones client-side).

---

## Estructura de un Formulario

### 1. Schema Zod — Archivo: `schemas/{modulo}/{nombre}.schema.ts`

```typescript
/**
 * @file {nombre}.schema.ts
 * @description Schema Zod para {descripción}.
 *
 * El schema se expone como factory function para recibir la función `t` de
 * next-intl, permitiendo mensajes de error traducidos en tiempo de render.
 */

import { z } from 'zod';

/**
 * Valores del formulario.
 * Tipo estático para no depender de z.infer sobre la factory.
 */
export type {FormName}FormValues = {
  amount: number;       // Monto en centavos/enteros
  player_user_id?: string;  // Opcional según el flujo
};

/**
 * Factory que construye el schema Zod con mensajes de error traducidos.
 *
 * Uso en componentes:
 * ```ts
 * const t = useTranslations('{modulo}');
 * const schema = useMemo(() => create{FormName}Schema(t), [t]);
 * ```
 *
 * @param t - Función de traducción
 * @returns Schema Zod listo para React Hook Form
 */
export function create{FormName}Schema(t: (key: string) => string) {
  return z.object({
    amount: z
      .number({ error: t('form.amount.errors.mustBeNumber') })
      .int(t('form.amount.errors.mustBeInteger'))
      .positive(t('form.amount.errors.mustBePositive')),
    player_user_id: z
      .string()
      .uuid()
      .optional(),
  });
}
```

---

### 2. Componente de Formulario — Archivo: `components/{modulo}/{nombre}-form.tsx`

```typescript
"use client";

import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  create{FormName}Schema,
  type {FormName}FormValues,
} from "@/schemas/{modulo}/{nombre}.schema";
import { useAction } from "@/hooks/{modulo}/use-action";

/**
 * Obtiene el mensaje de error traducido para un código del backend.
 *
 * Lógica:
 * 1. Si no hay código → mensaje genérico de servidor
 * 2. Si el código existe en translations → devuelve la traducción
 * 3. Si el código NO existe → mensaje genérico
 *
 * El mensaje genérico previene que se muestre el código raw al usuario.
 *
 * @param code - Código de error del backend (ej: "DEPOSIT.AMOUNT_OUT_OF_RANGE")
 * @param t - Función de traducción del namespace
 * @param fallback - Clave de fallback si no hay código
 */
function getBackendErrorMessage(
  code: string | undefined,
  t: (key: string) => string,
  fallback = "errors.serverError",
): string {
  if (!code) return t(fallback);

  // El backend usa "DOMINIO.CODIGO" → se normaliza a "DOMINIO__CODIGO" para i18n
  const normalized = code.replace(/\./g, "__");
  const errorKey = `errors.codes.${normalized}`;

  const translation = t(errorKey);

  if (translation === errorKey) {
    console.warn(`[{FormName}] Unknown error code: ${code}. Using generic.`);
    return t(fallback);
  }

  return translation;
}

/**
 * Formulario para {descripción}.
 *
 * Validación client-side con Zod + React Hook Form.
 * Errores del backend resueltos por `code` usando traducciones.
 *
 * @param props - callbacks de éxito y navegación
 */
export function {FormName}Form({
  onSuccess,
  onBack,
}: Readonly<{
  onSuccess: (data: ResponseType) => void;
  onBack: () => void;
}>) {
  const t = useTranslations("{modulo}");
  const { mutate, isPending, error, reset } = useAction();

  // Schema con mensajes traducidos — se recrea solo si cambia `t`
  const schema = useMemo(() => create{FormName}Schema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isValid },
  } = useForm<{FormName}FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  // Extraer código y status del error tipado
  const apiError = error as (Error & { code?: string; status?: number }) | null;

  const onSubmit = (values: {FormName}FormValues) => {
    reset(); // limpiar error previo

    mutate(values, {
      onSuccess: (data) => {
        onSuccess(data);
      },
      onError: (err) => {
        const typedErr = err as Error & { code?: string; status?: number };

        // 503: Servicio no disponible — toast con retry
        if (typedErr.status === 503) {
          toast.error(t("errors.serviceUnavailable"), {
            description: t("errors.serviceUnavailableDescription"),
            action: {
              label: t("errors.retry"),
              onClick: () => handleSubmit(onSubmit)(),
            },
          });
          return;
        }

        // 403: Sin permisos
        if (typedErr.status === 403) {
          setError("root", { message: t("errors.unauthorized") });
          return;
        }

        // 422: Error de lógica de negocio — mapear por código
        if (typedErr.status === 422) {
          if (typedErr.code === "MODULE.SPECIFIC_CODE") {
            setError("fieldName", {
              message: getBackendErrorMessage(typedErr.code, t),
            });
          } else {
            setError("fieldName", {
              message: getBackendErrorMessage(typedErr.code, t),
            });
          }
          return;
        }

        // Fallback: error genérico de servidor
        setError("root", {
          message: getBackendErrorMessage(typedErr.code, t),
        });
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card border rounded-2xl p-6 shadow-sm space-y-6"
    >
      <div className="space-y-4">
        {/* Campos del formulario */}
      </div>

      {/* Error global (403 / fallback) */}
      {(errors.root ||
        (apiError && !errors.amount && !errors.player_user_id)) && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-sm text-destructive">
          {errors.root?.message ?? t("errors.serverError")}
        </div>
      )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isPending}>
          {t("form.actions.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isPending || !isValid}
          className="bg-gradient-brand text-white shadow-lg shadow-primary/20 px-8"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("form.actions.processing")}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {t("form.actions.continue")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
```

---

## Reglas de Internacionalización (i18n)

### Namespace del Schema

El schema recibe `t` del namespace correspondiente (ej: `depositIntent`).

### Traducciones de Errores de Campo

En `messages/es.json` bajo el namespace del formulario:

```json
{
  "form": {
    "amount": {
      "label": "Monto a depositar",
      "errors": {
        "mustBeNumber": "Debe ser un número válido",
        "mustBeInteger": "Debe ser un número entero (sin decimales)",
        "mustBePositive": "El monto debe ser mayor a 0"
      }
    },
    "actions": {
      "cancel": "Cancelar",
      "continue": "Continuar",
      "processing": "Procesando..."
    }
  },
  "errors": {
    "serverError": "Error del servidor. Intenta nuevamente.",
    "serviceUnavailable": "Servicio temporalmente no disponible",
    "serviceUnavailableDescription": "No pudimos procesar tu solicitud. Revisá tu conexión.",
    "retry": "Reintentar",
    "unauthorized": "No tenés permisos para realizar esta operación",
    "codes": {
      "DEPOSIT__AMOUNT_OUT_OF_RANGE": "El monto debe estar entre $1.000 y $1.000.000"
    }
  }
}
```

---

## Validación de Montos (Regla Crítica)

```typescript
// ✅ CORRECTO: Entero positivo (ARS en centavos)
amount: z
  .number({ error: t('form.amount.errors.mustBeNumber') })
  .int(t('form.amount.errors.mustBeInteger'))
  .positive(t('form.amount.errors.mustBePositive'))

// ❌ INCORRECTO: Números con decimales para montos monetarios
amount: z.number() // ¡NO USAR PARA DINERO!
```

---

## Manejo de Errores por Código del Backend

El patrón `getBackendErrorMessage` normaliza los códigos del backend (`DOMINIO.CODIGO` → `DOMINIO__CODIGO`) para usar como keys de traducción. Esto permite traducción granular de errores sin exponer códigos raw al usuario.

Si el código no tiene traducción, se muestra el mensaje genérico (`errors.serverError`). Esto es intencional: nunca exponer mensajes técnicos del backend al usuario.