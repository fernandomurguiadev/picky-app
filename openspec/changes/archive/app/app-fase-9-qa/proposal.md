# Proposal — app-fase-9-qa

## Resumen

QA integral del frontend: pruebas en viewport móvil real, test anti-FOUC, auditoría de
seguridad (tokens, dangerouslySetInnerHTML, formularios), performance y tiempo real del
Kanban.

## Motivación

Antes de la demo final se debe garantizar que la app funciona correctamente en el viewport
mínimo (360px), que no hay vulnerabilidades de seguridad del lado del cliente y que las
métricas de performance (LCP) son aceptables.

## Alcance

No crea nuevos archivos. Verifica y corrige lo implementado en las fases anteriores.

## Criterios de aceptación

| ID | Criterio |
|----|---------|
| QA-1 | Toda vista funcional en 360×640 — sin scroll horizontal ni elementos rotos |
| QA-2 | 0 flashes visibles al cargar tienda pública (test anti-FOUC) |
| QA-3 | LCP < 2.5s en home de tienda pública (Lighthouse producción) |
| QA-4 | Pedido en tienda → aparece en kanban admin en < 500ms |
| QA-5 | 0 tokens en `localStorage` o `sessionStorage` |
| QA-6 | 0 ocurrencias de `dangerouslySetInnerHTML` en componentes (excepto el permitido en store layout) |
| QA-7 | `npm run lint && npm run typecheck` — 0 errores |
| QA-8 | Todos los `<form>` con validación Zod tienen `noValidate` |
