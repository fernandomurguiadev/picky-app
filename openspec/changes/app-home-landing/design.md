# Design: Marketing Landing Page

## Technical Approach

We will replace the default boilerplate in `app/src/app/page.tsx` with a modern React Server Component (RSC). This ensures zero client-side overhead, extremely fast Time To First Byte (TTFB), and perfect SEO metrics right out of the box. The visual layer relies completely on existing shadcn/ui Button primitives and Tailwind CSS v4 native utilities (gradient vectors, backdrop-filters).

## Architecture Decisions

### Decision: React Server Component (RSC) for Landing Page
**Choice**: Pure RSC implementation.
**Alternatives considered**: Client-side component (RCC).
**Rationale**: The landing page has no complex client interactivity besides basic hyperlinking. Making it a server component delivers the content instantly and boosts SEO performance, adhering strictly to Next.js 15 performance guidelines.

### Decision: Localization Approach (next-intl)
**Choice**: Fetch translations in the Server Component using `useTranslations('landing')`.
**Alternatives considered**: Inline hardcoded Spanish text.
**Rationale**: Ensures consistency with the existing `next-intl` setup in `app/src/app/layout.tsx` and facilitates multi-locale expansion in the future.

## Data Flow

```
Request (/) ──→ app/src/app/page.tsx (RSC)
                       │
                       ├──→ Load local es.json messages
                       │
                       └──→ Stream fully localized HTML directly to Client
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/src/app/page.tsx` | Modify | Cleans Next.js boilerplate, implements new structure (Hero, Grid). |
| `app/messages/es.json` | Modify | Appends `landing` schema with titles, descriptions, and CTA strings. |

## Interfaces / Contracts

The `es.json` translation schema will include the following shape:

```json
"landing": {
  "hero": {
    "badge": "Nueva era digital",
    "title": "Creá tu tienda digital en segundos",
    "subtitle": "La plataforma más ágil para vender online y enviar directo por WhatsApp.",
    "ctaPrimary": "Empezar gratis",
    "ctaSecondary": "Acceso comercio"
  },
  "features": {
    "mobile": {
      "title": "Diseño Mobile-First",
      "desc": "Tus clientes te compran directo desde el celular sin vueltas."
    },
    "whatsapp": {
      "title": "Pedidos por WhatsApp",
      "desc": "Recibí órdenes estructuradas listas para procesar."
    },
    "realtime": {
      "title": "Panel en Tiempo Real",
      "desc": "Gestioná el estado de tus envíos minuto a minuto."
    }
  }
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| E2E | Links navigation | Verify `/` successfully navigates to `/auth/login` and `/auth/register`. |
| Visual | Responsive structure | Manually inspect layout scaling at 360px, 768px, and 1280px widths. |

## Migration / Rollout

No migration required. The deployment simply overwrites the root route handler.
