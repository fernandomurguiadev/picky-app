# Exploration: Background Theming

## The Problem
By default, the storefront implies a strict white or light gray background. Store owners have requested the ability to change this to fit their brand identity better (e.g., a dark theme for a burger joint or a soft cream for a bakery). 
Allowing free-form hex color input is dangerous because it can easily lead to inaccessible, unreadable color combinations (e.g., dark text on a dark background).

## Options Evaluated
1. **Free-form HEX Input**: Users can select any background color.
   - *Pros*: Maximum flexibility.
   - *Cons*: High risk of breaking the UI if contrasts aren't properly calculated. Complex edge cases for UI components.
2. **Light/Dark Toggle**: Simple switch between a predefined light mode and dark mode.
   - *Pros*: Very safe, easy to implement.
   - *Cons*: Too restrictive. Brands want subtle tints like "mint" or "slate", not just pure black or white.
3. **Curated Presets with Auto-Contrast**: Provide a list of expert-selected background colors. The system dynamically checks the preset's luminance and automatically adjusts foreground elements to maintain accessibility.
   - *Pros*: Combines flexibility with bulletproof aesthetics and accessibility.
   - *Cons*: Requires slightly more complex frontend CSS variable injection and luminance logic.

## Selected Approach
**Option 3 (Curated Presets)** was selected because it guarantees a "premium" result without relying on the store owner's design skills. We will expand the original 5 presets to 15 to cover the vast majority of brand archetypes.
