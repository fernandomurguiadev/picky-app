# Proposal — app-fase-4-store-infra

## Resumen

Infraestructura de la tienda pública: layout SSR con inyección de tema (anti-FOUC), resolución
de slug via middleware, header con badge de estado abierto/cerrado y página 404 para slugs inválidos.

## Motivación

El layout de la tienda pública debe renderizar con el tema correcto desde el primer byte para
evitar el "flash of unstyled content" (FOUC). Esto requiere que el SSR inyecte las CSS variables
del tenant en un `<style>` inline antes de que cargue cualquier CSS externo.

## Alcance

### Frontend (`app/`)

- `app/(store)/[slug]/layout.tsx` — SSR de theme + header + badge estado
- `app/(store)/[slug]/not-found.tsx` — 404 amigable para slugs inválidos
- `middleware.ts` — ya implementado en FASE 1, solo verificar cobertura
- `lib/hooks/use-store.ts` — hooks para datos públicos de la tienda

## Rutas de API consumidas

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/stores/:slug` | Datos públicos del comercio |
| GET | `/stores/:slug/status` | Estado abierto/cerrado |
| GET | `/stores/:slug/tenant-id` | Ya cubierto por middleware (FASE 1) |

## Notas de implementación

- `layout.tsx` es un React Server Component (RSC) — `fetch` directo al backend sin Axios
- Las CSS variables se inyectan en un `<style>` tag inline para máxima velocidad
- El header de la tienda incluye: logo del comercio, nombre, badge de estado, CartBadge (FASE 6)
- La resolución de estado abierto/cerrado se hace en el servidor para SSR correcto
