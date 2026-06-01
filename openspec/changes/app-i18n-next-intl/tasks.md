# Tasks — app-i18n-next-intl

## Estado: en progreso

## Tareas

- [x] Crear proposal.md
- [x] Instalar `next-intl`
- [x] Crear `src/i18n/request.ts`
- [x] Actualizar `next.config.ts` con plugin
- [x] Actualizar `src/app/layout.tsx` con `NextIntlClientProvider`
- [x] Crear `messages/es.json` con mensajes iniciales
- [ ] Migrar strings hardcodeadas de componentes auth a mensajes

## Convenciones

- Namespaces en kebab-case: `auth`, `common`, `navigation`, `errors`, `validation`
- Keys en camelCase: `loginTitle`, `submitButton`
- Agregar nuevas keys siempre en `messages/es.json` primero
