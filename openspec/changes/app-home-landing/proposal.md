# Proposal: Marketing Landing Page

## Intent

The current root `/` route shows the default Next.js boilerplate. We need to replace it with a premium, high-conversion Landing Page for PickyApp to attract new businesses (`/auth/register`) and provide access to existing administrators (`/auth/login`).

## Scope

### In Scope
- **Hero Section**: Visually striking introduction to PickyApp with clear Call-To-Actions.
- **Value Proposition Cards**: Highlighting key benefits (Mobile-first, Real-time Orders, WhatsApp integration).
- **i18n Integration**: 100% of copy translated via `es.json` using `next-intl`.
- **Responsive Layout**: Full support from 360px width viewport, with beautiful glassmorphism and gradients.

### Out of Scope
- **Internal Storefront**: Product catalog navigation remains dynamic under `/[slug]`.
- **Direct Login Form**: Forms are located in the established `/auth` routes.

## Capabilities

### New Capabilities
- `marketing-landing`: Institutional marketing home page describing system benefits and directing traffic to authentication channels.

### Modified Capabilities
None.

## Approach

Refactor `app/src/app/page.tsx` into a performant React Server Component (RSC) that loads the localized homepage. We will employ modern UI aesthetics using Tailwind CSS v4 gradients, OKLCH vibrant primary color `oklch(0.55 0.22 250)`, and subtle `backdrop-blur` layers for a premium feel. All buttons will reuse the existing shadcn/ui primitives.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/src/app/page.tsx` | Modified | Replaces boilerplate with standard marketing landing page structure. |
| `app/messages/es.json` | Modified | Addition of `landing` translation dictionary object. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Overloading dependencies or animations causing performance drop | Low | Keep visuals light, use CSS native animations/gradients, rely on Next.js image optimization. |

## Rollback Plan

Restore `app/src/app/page.tsx` to its previous state or use a lightweight redirect component to `/auth/login`.

## Dependencies

- Existing auth infrastructure (`/auth/login`, `/auth/register`).
- next-intl messages loaded in Layout.

## Success Criteria

- [ ] Replaces standard Next.js boilerplate with the PickyApp Marketing Landing.
- [ ] Direct links to `Register` and `Login` are functional.
- [ ] 100% responsive down to 360px mobile viewport.
- [ ] Translates all texts using `es.json`.
