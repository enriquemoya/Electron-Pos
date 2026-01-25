# Online Store Frontend v1 - Design

## Routing Map
- /
- /catalog
- /product/[slug]
- /cart
- /checkout

## Page Responsibilities
- Home: brand and featured categories, links to catalog.
- Catalog: grid listing, filtering, and inventory state labels.
- Product Detail: product info, inventory state, add to cart.
- Cart: item list, quantity controls, warnings for unavailable items.
- Checkout: customer details, review, submit order (no payment).

## Data Flow
- Catalog: catalog listing MUST be sourced from a Cloud read-model list endpoint (read-only), NOT from /sync/pending. The endpoint name is defined by the Cloud API spec and the frontend must follow that contract.
- Product Detail: GET /product/:id or slug mapping.
- Cart and Checkout: client-side state only.
- Order submission: POST /orders.

## Inventory State Interpretation
- AVAILABLE: allow add to cart and checkout.
- LOW_STOCK: allow add to cart, show caution message.
- SOLD_OUT: block add to cart and checkout.
- PENDING_SYNC: allow browsing, block checkout, show warning.

## Cart Architecture
- Client-side state only.
- Persistence via localStorage is allowed.
- Cart state is not authoritative and may be cleared by user.

## Checkout Flow
1) Review cart items and states.
2) Collect name, email, phone, and delivery notes.
3) Validate items are not SOLD_OUT or PENDING_SYNC.
4) Submit POST /orders with items.
5) Show confirmation page with order id.

## Mobile vs Desktop Behavior
- Mobile: stacked layout and drawer cart.
- Desktop: grid layout with side cart or drawer.

## UX Guardrails
- Do not promise availability.
- Use warning copy for LOW_STOCK and PENDING_SYNC.
- Show clear errors on API failure.
