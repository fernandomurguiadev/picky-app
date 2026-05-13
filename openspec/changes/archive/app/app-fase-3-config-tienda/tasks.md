# Tasks — app-fase-3-config-tienda

## Fase de implementación: FASE 3 — Admin: Configuración de Tienda

**Prerequisito:** FASE 2 completada (catálogo admin).

---

## Tipos y hooks

### FE3.0 — Tipos TS y hooks

- [x] Crear `lib/types/store-settings.ts`: `Shift`, `DayKey`, `DaySchedule`, `StoreSettings`, `Tenant`
- [x] Crear `lib/hooks/admin/use-store-settings.ts`: `settingsKeys`, `useStoreSettings`, `useUpdateStoreSettings`, `useToggleStoreStatus`

**Criterio de done:** Hooks exportados y tipados.

---

## Layout de settings

### FE3.1 — Settings layout

- [x] Crear `app/(admin)/admin/settings/layout.tsx`
- [x] Desktop: sidebar izquierda sticky con links de navegación
- [x] Mobile: tabs horizontales con scroll
- [x] Active detection via `usePathname()`
- [x] Links: Info, Horarios, Entrega, Pagos, Tema

**Criterio de done:** Navegación entre secciones funcional en móvil y desktop.

---

## Secciones de configuración

### FE3.2 — Sección Info

- [x] Crear `app/(admin)/admin/settings/info/page.tsx`
- [x] Formulario RHF + Zod: nombre (requerido), descripción, teléfono, whatsapp, dirección
- [x] `ImageUploader` para logo con preview inmediato
- [x] `useEffect` sincroniza form desde `settings`
- [x] `isDirty` deshabilita "Guardar cambios" si no hay cambios
- [x] Submit llama `useUpdateStoreSettings`

**Criterio de done:** Guardar persiste. Logo con preview inmediato.

---

### FE3.3 — HoursEditor + Sección Horarios

- [x] Crear `components/admin/hours-editor/index.tsx`
- [x] `useFieldArray` en `schedule` (7 días)
- [x] Por cada día: `Switch` toggle activo/inactivo, `useFieldArray` anidado en `shifts`
- [x] Botón "2° turno" visible si `shifts.length < 2`
- [x] Inputs time para `open` y `close` por turno
- [x] Crear `app/(admin)/admin/settings/hours/page.tsx` usando `HoursEditor`

**Criterio de done:** Toggle por día. Hasta 2 turnos por día. Guardado funcional.

---

### FE3.4 — Sección Entrega

- [x] Crear `app/(admin)/admin/settings/delivery/page.tsx`
- [x] Toggles: delivery, takeaway, inStore
- [x] Campos condicionales: costo de envío y monto mínimo (visibles si `deliveryEnabled`)
- [x] Precios en pesos (UI) → centavos al enviar (`tosCents`)
- [x] Schema Zod sin `.optional()` en campos con default (para evitar tipos incompatibles con RHF)

**Criterio de done:** Monto mínimo guardado en centavos. Campos condicionales correctos.

---

### FE3.5 — Sección Pagos

- [x] Crear `app/(admin)/admin/settings/payments/page.tsx`
- [x] Toggles: efectivo, transferencia, tarjeta
- [x] Campo alias para transferencia (visible si `transferEnabled`)
- [x] Validación Zod `.refine`: al menos un método activo
- [x] Error inline si el usuario intenta desactivar todos

**Criterio de done:** Al menos un método siempre activo (validación).

---

### FE3.6 — ThemeEditor + Sección Tema

- [x] Crear `components/admin/theme-editor/index.tsx`
- [x] Color pickers para `primaryColor` y `accentColor` (input type="color" + input texto hex)
- [x] `StorePreview` sub-componente: preview en tiempo real con `watch()` aplicado como CSS vars
- [x] Props: `value`, `storeName`, `onSubmit`, `isPending`
- [x] Crear `app/(admin)/admin/settings/theme/page.tsx` usando `ThemeEditor`

**Criterio de done:** Preview muestra colores actualizados en tiempo real al cambiar los inputs.
