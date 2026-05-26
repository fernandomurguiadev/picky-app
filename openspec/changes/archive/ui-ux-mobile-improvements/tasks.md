# Tasks

- [x] Remove legacy toast notifications from `product-detail-sheet`.
- [x] Create new `FloatingCartBanner` component with internal delayed state.
- [x] Add pop/scale animation to `CartBadge` and sync JS timeout with CSS duration (300ms).
- [x] Implement horizontal scroll affordance (fade out) to `CategoryNav`.
- [x] Fix active category sync using IntersectionObserver logic in `CategoryNav`.
- [x] Adjust dynamic sticky header offsets in `[slug]/page.tsx` using `scroll-mt`.
- [x] Refactor cart summary list in `checkout-client` to scroll internally (`overflow-y-auto`) and style scrollbar to be visibly persistent.
- [x] Remove hardcoded `pb-24` from `[slug]/layout.tsx` to fix checkout page scroll bleed.
- [x] Conditionally inject `h-24` spacer from `FloatingCartBanner` based on active route.
