# Technical Design: Refactor i18n Frontend

## Architecture
- **Library:** `next-intl`
- **Location:** Dictionary file at `app/messages/es.json`
- **Hook (Client):** `useTranslations('namespace')`
- **Method (Server):** `getTranslations('namespace')`

## Viewport Constraints (Mobile First)
El cambio de textos no debe modificar la estructura de HTML. En viewports de 360px los textos seguirán comportándose igual debido a Tailwind CSS (p.ej. `truncate`, `line-clamp-1`), pero se revisará si alguna clave en `es.json` genera un desborde.

## Migration Strategy
Para cada componente:
1. Identificar strings hardcodeados.
2. Buscar si existe la clave adecuada en `es.json`.
3. Si no existe, agregarla bajo el grupo lógico (`common`, `auth`, `store`, etc.).
4. Reemplazar texto por la función de traducción correspondiente.
5. Si un texto usa variables dinámicas, usar sintaxis de `next-intl` (ej: `{min} caracteres`).

## Error Handling
Si falla una clave, `next-intl` por defecto renderiza la clave en formato `namespace.key`. Para evitar esto, verificaremos la compilación localmente antes del commit.
