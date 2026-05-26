# Proposal: UI/UX Mobile Improvements

## Intent
Upgrade the mobile user experience of the PickyApp store to match premium delivery applications by replacing outdated interaction patterns (toasts, full-element bounces) with modern, subtle micro-interactions (floating banners, localized scale animations, scroll affordances).

## Scope
This change affects the public-facing storefront components, specifically:
- Cart notifications and triggers (`CartBadge`, `FloatingCartBanner`, `product-detail-sheet`)
- Category navigation (`CategoryNav`)
- Checkout layout and product summary (`checkout-client`, `layout.tsx`)
- App-wide scroll offsets (`[slug]/page.tsx`)

## Approach
1. **Floating Cart Banner**: Introduce `FloatingCartBanner` that listens to `cart.store` and displays total items and price. It will automatically hide on the `/checkout` route.
2. **Delayed Price Update**: Implement a `setTimeout` (350ms) between the cart quantity pop animation and the price update to simulate a physical cash register calculating the total.
3. **CategoryNav Affordance**: Add a `pointer-events-none` gradient shadow overlay on the right side of the horizontal scrolling container.
4. **Checkout Layout Fix**: 
   - Remove `pb-24` from `layout.tsx`.
   - Have `FloatingCartBanner` return a structural `h-24` spacer only when it is actively rendered.
   - Refactor the product list in `checkout-client` to use `max-h-32`, `overflow-y-auto`, and custom `::-webkit-scrollbar` styling so the scrollbar is prominently visible only when the list overflows.
5. **Scrollspy Alignment**: Adjust the `scroll-mt` offsets in `[slug]/page.tsx` to properly account for the sticky category navigation and the store header.
