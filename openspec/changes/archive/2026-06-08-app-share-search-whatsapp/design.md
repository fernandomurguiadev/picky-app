# Technical Design: Share Search and Category via WhatsApp

## Architecture Overview
This is a frontend-only change in `linxdash-app`. We will leverage Next.js App Router hooks (`useSearchParams`, `useRouter`, `usePathname`) to read and mutate the URL state. We will ensure robust parameter handling to prevent empty keys and scroll jumps.

## State Management Approach
- **Read**: Use `useSearchParams()` in the relevant Client Component. Initialize the local state from these params.
- **Write**: Use `useRouter().replace()` to update parameters without bloating browser history unnecessarily (especially for typing).
  - **CRITICAL**: Next.js defaults to scrolling to top on navigation. We MUST use `{ scroll: false }` in the `replace()` call to maintain the user's scroll position when they select a filter.
  - **Cleanup**: Before pushing, if a parameter is empty string `""` or `undefined`, it should be `delete`d from the `URLSearchParams` object to keep the URL clean.

## Components Affected
- **Catalog/Search Page Component**: Needs to connect its pagination, search, and category state to the URL.
- **Search Bar / Category Filters / Pagination**: Emit changes that update the URL.
- **ShareButton Component (NEW)**: A new UI component that constructs the trackable URL and handles the share action.

## Sharing Implementation
We will use a utility function to build the final URL and handle the sharing logic:
```javascript
const handleShare = async () => {
  const url = new URL(window.location.href);
  url.searchParams.set('utm_source', 'whatsapp_share');
  url.searchParams.set('utm_medium', 'seller_link');
  
  const text = `Mirá este catálogo: `;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Catálogo LinXDash',
        text: text,
        url: url.toString(),
      });
      return;
    } catch (err) {
      // User cancelled or failed, fallback gracefully
      console.log('Share API failed, falling back...');
    }
  }
  
  // Fallback for Desktop / Unsupported browsers
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text + url.toString())}`;
  window.open(waUrl, '_blank');
};
```

## Risks and Mitigations
- **Scroll Jumps**: **Mitigation**: Passing `{ scroll: false }` to router methods.
- **Hydration Mismatch**: **Mitigation**: Ensure `window.location` and `navigator.share` are only evaluated inside event handlers (`onClick`) or `useEffect`, not during SSR.
- **Stale Closures**: **Mitigation**: When updating `URLSearchParams`, always instantiate a new one based on the current `useSearchParams()` value to avoid losing other parameters.
