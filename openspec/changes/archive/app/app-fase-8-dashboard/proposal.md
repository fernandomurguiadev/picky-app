# Proposal — app-fase-8-dashboard

## Resumen

Dashboard del admin con métricas del negocio (pedidos, ingresos, ticket promedio), toggle
de estado abierto/cerrado y wizard de onboarding para nuevos comercios.

## Motivación

El dashboard es la pantalla de inicio del admin y proporciona visibilidad del estado del
negocio de un vistazo. El onboarding es crítico para que los nuevos comercios puedan
configurar su tienda correctamente desde el primer acceso.

## Alcance

### Frontend (`app/`)

- `app/(admin)/admin/dashboard/page.tsx` — métricas + toggle abierto/cerrado
- `app/(admin)/admin/onboarding/page.tsx` — wizard multi-paso
- `components/admin/metric-card/index.tsx` — card de métrica
- `lib/hooks/use-analytics.ts` — hook para datos del dashboard

## Rutas de API consumidas

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/admin/analytics/summary` | Métricas del día/semana/mes |
| GET | `/admin/analytics/hourly` | Distribución horaria (gráfico) |
| PATCH | `/stores/me` | Toggle abierto/cerrado |

## Notas de implementación

- Dashboard es híbrido: métricas con TanStack Query (client) + SSR inicial
- En móvil: 4 cards con métricas. En desktop: cards + gráfico de barras
- Toggle abierto/cerrado: llama `PATCH /stores/me` con `{ isOpen: !current }`
- Onboarding: verificar en middleware/dashboard si el comercio tiene logo y al menos 1 producto → si no, redirigir al wizard
