# Proposal — app-i18n-next-intl

## Resumen

Integración de `next-intl` para internacionalización del frontend. Fase inicial con soporte exclusivo para español (`es`). La arquitectura queda lista para agregar idiomas adicionales sin reestructurar el proyecto.

## Motivación

Centralizar todas las cadenas de texto de la UI en archivos de mensajes tipados, evitar hardcoding de strings en componentes, y preparar la plataforma para escalar a múltiples idiomas en el futuro.

## Decisiones de diseño

- **Sin i18n routing**: No se agregan prefijos de locale en las URLs (ej. `/es/login`). El locale `es` es fijo en la capa de servidor. Esto preserva el routing existente (tenant slugs, admin, auth) sin refactoring.
- **Locale estático**: `src/i18n/request.ts` retorna siempre `es`. Cuando se agreguen idiomas, se puede leer de la cookie o del header `Accept-Language`.
- **Messages path**: `app/messages/{locale}.json` — convención estándar de next-intl.

## Alcance

### Frontend (`app/`)

| Archivo | Acción |
|---------|--------|
| `package.json` | Agregar `next-intl` como dependencia |
| `next.config.ts` | Envolver con `createNextIntlPlugin` |
| `src/i18n/request.ts` | Config server-side de next-intl |
| `src/app/layout.tsx` | Agregar `NextIntlClientProvider` |
| `messages/es.json` | Mensajes iniciales en español |

### Spec (`openspec/`)

| Archivo | Acción |
|---------|--------|
| `openspec/changes/app-i18n-next-intl/proposal.md` | Este archivo |
| `openspec/changes/app-i18n-next-intl/tasks.md` | Tareas de seguimiento |

## Estructura de mensajes (`messages/es.json`)

```
{
  "common": { ... },       // acciones globales: guardar, cancelar, confirmar
  "auth": { ... },         // login, register, forgot-password
  "navigation": { ... },   // menú, back, home
  "errors": { ... },       // mensajes de error genéricos
  "validation": { ... }    // mensajes de validación de formularios
}
```

## Uso en componentes

```tsx
// Server Component
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('auth');

// Client Component
import { useTranslations } from 'next-intl';
const t = useTranslations('common');
```

## Notas

- El middleware existente no se modifica — next-intl en modo sin routing no requiere cambios en el matcher.
- Los mensajes siguen kebab-case en las keys de namespace y camelCase en las keys de mensaje.
- Los componentes migrados a i18n deben eliminar strings hardcodeadas.
