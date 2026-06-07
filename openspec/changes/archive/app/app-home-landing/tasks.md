# Tasks: Marketing Landing Page

## Phase 1: Foundation & Localization

- [x] 1.1 Add the `"landing"` translation block to `app/messages/es.json` containing all copy text for Hero and Feature cards.
- [x] 1.2 Verify existing layout configurations in `app/src/app/layout.tsx` to ensure `next-intl` loads messages properly at the root route.

## Phase 2: Core Implementation

- [x] 2.1 Clean the Next.js boilerplate from `app/src/app/page.tsx` and convert it into a basic RSC structure.
- [x] 2.2 Implement the Hero section in `app/src/app/page.tsx` with Tailwind v4 gradients, Geist font utility, and CTAs linking to `/auth/register` and `/auth/login`.
- [x] 2.3 Implement the Features Grid utilizing existing system variable tokens (`--color-primary`, `backdrop-blur`, `--radius`).
- [x] 2.4 Assemble the global layout structure of the page (Header logotype + Main + Simple Footer).

## Phase 3: Visual Refinement & Verification

- [x] 3.1 Validate complete responsive layout on viewports of 360px (mobile base) and 1280px (desktop).
- [x] 3.2 Verify dark mode compatibility toggles properly through OKLCH variable shifts.
- [x] 3.3 Verify there are 0 hardcoded strings, all coming via `useTranslations('landing')`.
