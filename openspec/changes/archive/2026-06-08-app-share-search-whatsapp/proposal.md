# Proposal: Share Search and Category via WhatsApp

## Intent
Allow sellers to share their current catalog view (selected category, search filters, and active page) with clients via WhatsApp using a direct link, enabling tracking of these interactions.

## Problem Context
Currently, if a seller filters products by a specific category, types a search query, or navigates to page 3, that state is not easily shareable. If they want to send exactly those results to a client, they have to tell the client what to search for manually. This adds friction to the sales process.

## Proposed Solution
We will implement "State in URL" for the search, category filters, and pagination. By syncing the frontend state with URL query parameters (e.g., `?category=electronics&q=laptop&page=2`), we enable deep-linking. We will also add a strategic "Share" button in the UI. For mobile devices, we will use the native Web Share API (`navigator.share`), and for desktop, we will fallback to a direct WhatsApp Web link. 

Additionally, shared links will append UTM parameters (e.g., `utm_source=whatsapp_share`) to allow the business to track conversions originating from seller shares.

## Scope
- Sync search input, category selection, and pagination state with URL query parameters in `linxdash-app`.
- Read initial state from URL on page load.
- Properly clear parameters from the URL when a filter is removed or emptied.
- Add a Share button in the catalog/search view (utilizing `navigator.share` or WhatsApp fallback).
- Append UTM tracking parameters to the generated share link.
- Update `store` or URL hooks to manage this state seamlessly without causing page scroll jumps (`scroll: false`).

## Out of Scope
- Backend modifications (this is purely a frontend state sync feature).
