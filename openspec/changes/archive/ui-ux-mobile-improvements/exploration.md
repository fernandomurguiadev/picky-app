# Exploration: UI/UX Mobile Improvements

## The Problem
The current mobile experience of the PickyApp store feels somewhat rigid and outdated compared to premium delivery apps like PedidosYa or UberEats. Specifically:
- **Notifications**: Adding an item to the cart triggers a standard "toast" notification. This pattern is old and intrusive. Modern apps use a persistent floating cart banner that updates dynamically.
- **Scroll Affordance**: The horizontal menu for categories lacks a visual cue that it is scrollable. Users might not realize there are more categories hidden to the right.
- **Micro-interactions**: The cart badge fully bounces when an item is added, which feels clunky rather than responsive.
- **Layout Issues**: The Checkout page suffers from "infinite scroll" when a user adds many items to the cart, as the product list stretches the main page layout rather than containing the scroll internally. Furthermore, the global layout applies a bottom padding (`pb-24`) unconditionally, causing an unnecessary scroll bleed on the checkout page where the floating banner shouldn't even be visible.

## Options Explored
1. **Notifications**:
   - *Option A*: Custom styled toasts. (Rejected: Still interrupts flow).
   - *Option B*: A sticky `FloatingCartBanner` at the bottom of the screen. (Selected: Premium feel, ubiquitous in modern delivery apps).

2. **Micro-interactions for Cart Add**:
   - *Option A*: `animate-bounce` on the whole button. (Rejected: Too aggressive).
   - *Option B*: Pop/scale animation specifically on the number badge, with a slight delay on the price update for a "cash register" effect. (Selected: Feels polished and deliberate).

3. **Scroll Affordance (CategoryNav)**:
   - *Option A*: A scrollbar. (Rejected: Ugly on mobile).
   - *Option B*: A gradient mask fading out to the right. (Selected: Clean, intuitive visual cue).

4. **Checkout Scroll Layout**:
   - *Option A*: Hide the entire checkout in a modal. (Rejected: Too heavy of a refactor).
   - *Option B*: Apply `max-h-32` and `overflow-y-auto` to the product summary list, style the scrollbar to be always visible when active, and remove the global `pb-24` from `layout.tsx` (injecting it only when the floating banner renders). (Selected: Fixes the issue locally without breaking global layouts).

## Conclusion
We will proceed with a comprehensive UX overhaul targeting these specific interactions and layout bugs to achieve a "premium app" feel.
