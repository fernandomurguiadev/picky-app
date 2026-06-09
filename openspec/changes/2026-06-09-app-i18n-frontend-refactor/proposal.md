# Proposal: Refactor de i18n en Frontend

## Intent
Migrar todos los textos hardcodeados en línea dentro de los componentes del frontend de PickyApp a un sistema centralizado de internacionalización (i18n) usando `next-intl` y el archivo `es.json`. 

## Context
Actualmente, salvo excepciones como `store-status-badge`, la mayoría de las pantallas y componentes (`Auth`, `Dashboard`, `Settings`, `Checkout`, `Storefront`) tienen textos en español hardcodeados en el código TypeScript/TSX. Esto impide escalar la aplicación a otros idiomas y dificulta la revisión de los copys por equipos de producto.

## Proposed Approach
- Utilizar `next-intl` (ya instalado y configurado en el proyecto).
- Dividir la refactorización en fases lógicas: Auth, Storefront, Admin.
- Mantener compatibilidad con RSC usando `getTranslations()` y RCC usando `useTranslations()`.
- Agregar nuevas claves al `app/messages/es.json` según sea necesario, agrupadas lógicamente.

## Scope
**Afecta:** Frontend (Proyecto `app`)
**Excluye:** Backend (Proyecto `api`), y lógica de base de datos.
**Impacto en Multi-tenancy:** Nulo. Es puramente una capa de presentación.

## Alternatives Considered
- Extraer a un objeto de constantes local: Descartado porque no permite escalabilidad a múltiples idiomas ni aprovecha las ventajas de RSC que provee `next-intl`.
