# Specification: Share Search and Category via WhatsApp

## Requirements
- The application MUST read `category`, `q` (search query), and `page` from the URL parameters on load and apply them to the product list.
- When the user selects a category, types a search, or changes pages, the URL MUST update automatically.
- Empty states MUST be handled: clearing a search query or deselecting a category MUST remove the parameter from the URL entirely (e.g., `?q=` should not exist, it should just be completely removed).
- The URL updates MUST NOT cause the page to scroll to the top unexpectedly.
- The UI MUST have a "Share" button visible in the catalog or search results area.
- Clicking the Share button MUST:
  1. Append `utm_source=whatsapp_share&utm_medium=seller_link` to the shared URL.
  2. Use `navigator.share` if available (typically mobile).
  3. Fallback to generating a `wa.me` link if `navigator.share` is unavailable (typically desktop).
- The shared message should be formatted, e.g., "Check out these products: [URL]".

## Scenarios

### Scenario 1: User shares a filtered category on page 2
**Given** the user is on the catalog page
**When** the user selects the category "Zapatillas" and navigates to page 2
**Then** the URL updates to `?category=Zapatillas&page=2`
**And** clicking the Share button shares a link pointing to `?category=Zapatillas&page=2&utm_source=whatsapp_share&utm_medium=seller_link`.

### Scenario 2: User clears a search query
**Given** the user is on the catalog page with URL `?q=Nike`
**When** the user deletes the text in the search bar
**Then** the URL updates to remove the `q` parameter (e.g., returning to `/catalog`).

### Scenario 3: Native Share vs Desktop Fallback
**Given** the user clicks the Share button
**When** they are on a mobile device supporting Web Share API
**Then** the native OS sharing drawer opens
**When** they are on a desktop browser without Web Share API
**Then** a new tab opens directly to WhatsApp Web (`https://wa.me/...`).

### Scenario 4: User opens a shared link
**Given** a user clicks a shared link with `?category=Zapatillas&q=Nike&page=1`
**When** the application loads
**Then** the UI automatically selects "Zapatillas", populates the search bar with "Nike", sets pagination to page 1, and fetches the correct results.
