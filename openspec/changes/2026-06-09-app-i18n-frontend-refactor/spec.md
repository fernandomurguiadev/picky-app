# Specification: Refactor i18n Frontend

## Requisitos

- El sistema DEBE proveer textos internacionalizados a todos los componentes principales del frontend (`Auth`, `Dashboard`, `Settings`, `Checkout`, `Catalog`).
- El sistema NO DEBE contener strings hardcodeados de UI en los archivos TS/TSX afectados por este feature.
- El sistema DEBE utilizar el diccionario centralizado en `app/messages/es.json`.
- El sistema DEBE soportar RSC (React Server Components) a través de `getTranslations()` sin degradar el rendimiento de Server Side Rendering.
- El sistema DEBE soportar RCC (React Client Components) usando el hook `useTranslations()`.

## Escenarios

### Escenario 1: Renderizado de Auth (Server Component)
**DADO** un usuario que navega a `/login`
**CUANDO** la página hace render en el servidor
**ENTONCES** los textos se extraen del namespace `auth` del diccionario
**Y** se renderiza el HTML final con los textos correctos.

### Escenario 2: Renderizado Interactivo (Client Component)
**DADO** un usuario en el formulario de Checkout
**CUANDO** ocurre un error de validación de formulario
**ENTONCES** el texto de error se obtiene vía `useTranslations('validation')` de `next-intl`.

## Criterios de Aceptación
- CA-001: Todos los componentes de Auth no contienen textos en español hardcodeados.
- CA-002: Todos los componentes del Admin Dashboard y Settings no contienen textos en español hardcodeados.
- CA-003: Todos los componentes de la Tienda (Checkout, Catalog, etc) no contienen textos en español hardcodeados.
- CA-004: La compilación no arroja errores de tipado en `next-intl` (claves faltantes).
