# Mobile UX/UI Improvements

## Context
The previous mobile user experience lacked the premium feel associated with modern delivery applications (e.g., PedidosYa, Rappi). The interactions were somewhat rigid:
- Toast notifications for adding items to the cart felt outdated and intrusive.
- The horizontal category selector didn't clearly indicate that more categories could be scrolled into view (lack of affordance).
- The "View Cart" sticky button was obscured or caused layout shifts.
- Checkout page product lists caused infinite scrolling on mobile devices.

## Requirements
1. **Floating Cart Banner**: Replace toast notifications with a smooth, floating "View Order" banner at the bottom of the screen that dynamically updates.
2. **Micro-interactions**: Incorporate subtle CSS/Tailwind animations (pop, scale) to notify users of state changes (e.g., cart count increments) without interrupting their workflow.
3. **Cash Register Effect**: Delay the total price update slightly after adding an item to create a visually satisfying delay.
4. **Scroll Affordance**: Add gradient fade masks/shadows to horizontal scrolling containers (like the category nav) to visually indicate scrollability.
5. **Layout Stability**: Ensure fixed elements (headers, floating banners) do not obscure content, and that internal views like the Checkout list have their own scroll context (`max-height` with `overflow-y-auto`) to avoid stretching the entire page.

## Implementation Details
- `FloatingCartBanner`: A new client component using `animate-in` from `tailwindcss-animate`, syncing state with Zustand.
- `CategoryNav`: Incorporates a fade-out shadow wrapper on the right side.
- `checkout-client`: Implements an internal `max-h-32` and `overflow-y-auto` scroll box for the cart summary list with custom, always-visible scrollbars via `::-webkit-scrollbar` styling.
- `layout.tsx` (store): Removed hardcoded `pb-24` and moved spacer logic internally into the `FloatingCartBanner` component so it is only applied when the banner is visible.
