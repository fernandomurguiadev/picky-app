# Design: Background Theming

## Overview
Stores require the ability to modify their background color to suit their brand identity, moving beyond a forced white background. To prevent poor design choices that break accessibility, a curated list of presets is offered instead of a free hex color picker.

## Architecture & Implementation
1. **Database Expansion**: The `store_settings` table includes a `backgroundColor` column (varchar(7)).
2. **Preset Registry**: The Admin interface provides 15 highly curated background color presets (e.g., Modern Light, Minimal Cream, Obsidian Night, Wine Dark, Slate, Blush Pink).
3. **Contrast Calculation**: When the user selects a preset, the application evaluates its luminance. Dark backgrounds automatically flip the interface's foreground variables to ensure high-contrast legibility (switching text to white, borders to faint white).
4. **CSS Variable Injection**: The storefront reads `backgroundColor` and updates the root `--background` and `--color-background` CSS variables at runtime, seamlessly applying the theme across all components without needing manual dark mode toggles.

## Verification
- Modifying the preset in the Admin Theme Editor instantly reflects in the `StorePreview`.
- Visiting the public storefront renders the custom background.
- Dark backgrounds automatically maintain readable contrasting text.
