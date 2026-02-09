# Design: Online Store Cart v1

## High-level architecture
- Client-side cart state stored in a CartProvider (React context + reducer).
- CartProvider is mounted at the app layout level so it is available on all pages.
- Server components fetch catalog data; client components receive product payloads for add-to-cart.
- No Cloud API calls from client components.

## Data flow
1. Server components fetch catalog/PDP data.
2. Client add-to-cart action passes product payload to CartProvider.
3. CartProvider updates in-memory state and persists to localStorage.
4. Header cart icon opens cart drawer (shadcn Sheet).
5. Cart page reads from CartProvider and shows full cart detail.

## State ownership
- Source of truth: localStorage (client only).
- In-memory state mirrors localStorage and is kept in sync on change.

## Cart item model (client)
- id: string (productId)
- slug: string | null
- name: string
- imageUrl: string | null
- price: number | null
- currency: string ("MXN")
- game: string | null
- availability: "in_stock" | "low_stock" | "out_of_stock" | "pending_sync" | "unknown"
- quantity: number (min 1)

## Quantity rules
- Quantity cannot be less than 1.
- If availability is out_of_stock, disable increment and show a warning; allow remove.
- If availability is pending_sync or unknown, allow increment but show a warning message.
- No stock guarantees are implied; copy must reflect semantic-only availability.

## Drawer UX
- Use shadcn Sheet. Mobile is full screen; desktop is right side max-w-md (448px).
- Shows list of items, quantity stepper, remove button, subtotal.
- Empty state shows call to action back to catalog.
- Primary action links to /{locale}/cart.

## Cart page UX
- Route: /{locale}/cart
- Shows full list with quantity controls and remove action.
- Summary section shows subtotal and informational note that checkout is not available.

## Header behavior
- Add cart icon (lucide) aligned with other header icons.
- Mobile: icon-only (no text label).
- Badge shows item count when > 0.
- Clicking icon opens cart drawer.

## Add-to-cart entrypoints
- Allowed on PDP.
- Allowed on catalog product cards in the grid.
- Allowed on featured cards, including landing featured grid.

## Card add-to-cart controls
- Cards use a compact numeric input with +/- buttons (min 1).
- A small yellow cart icon button triggers add-to-cart with the selected quantity.
- Disable increment when availability is out_of_stock.
- pending_sync and unknown allow add-to-cart but show warning text.
## PDP add-to-cart
- PDP uses the existing text button for add-to-cart.

## Error and edge cases
- localStorage parse errors reset cart to empty state.
- Items missing price show "price unavailable" message (localized) and still render.
- If availability is missing, treat as "unknown".
- Cart must render even when JavaScript hydration is delayed (show skeletons as needed).

## Availability mapping
- Use existing semantic availability values from catalog data: in_stock, low_stock, out_of_stock, pending_sync.
- pending_sync shows a warning but does not block add-to-cart.

## i18n and accessibility
- All user-facing text localized via next-intl.
- Drawer and cart page must be keyboard accessible and announce actions (aria-labels).
- Icon buttons require accessible labels.

## Optional share link (not required)
- If implemented, use a URL-safe base64 encoded cart payload.
- Must not include sensitive data; product metadata only.
- Should be behind a "Copy share link" button in cart page.
