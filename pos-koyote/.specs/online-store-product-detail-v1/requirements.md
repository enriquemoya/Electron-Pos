## Purpose
Define the v1 Product Detail Page (PDP) for the public online-store.

The PDP is a read-only page that presents a single product with:
- Image
- Name
- Game and category context
- Semantic availability
- Price (when available)
- Short description (optional)
- Related products (best-effort)

## Goals
- Provide a mobile-first product detail experience under locale routes (/es, /en).
- Reuse existing header/navigation (do not re-implement).
- Use shadcn/ui primitives and Tailwind only.
- Fetch data from Cloud API read models only (no direct DB access).
- Show availability as semantic labels only (no stock guarantees, no quantities).
- Render safely when optional fields are missing (null-safe UI).
- Provide skeleton loading and safe empty/error states.

## Non-goals
- No add-to-cart or cart state changes.
- No checkout flow.
- No authentication or accounts.
- No reviews, ratings, wishlists, or social features.
- No admin/editor tooling.
- No POS or Electron changes.
- No Cloud API changes in this spec.

## Scope
In scope:
- PDP route and layout under locale scope:
  - Canonical: /product/[slug]
  - Effective: /{locale}/product/[slug] (e.g. /es/product/prod-001)
- Read-only product fetch and rendering.
- Related products section (best-effort, read-only).
- Loading, empty, and error states.
- i18n keys for all user-visible strings (including metadata).
- Accessibility requirements for PDP content.

Out of scope:
- Catalog page behavior changes (filters, sorting, pagination).
- Any write operations.

## Constraints
- Online-store only.
- URL-based locales only (/es default, /en). No browser or IP auto-detection.
- Dark theme only. No glassmorphism.
- Tailwind + shadcn/ui components only.
- No hardcoded user-visible strings in JSX.
- Data is read-only from Cloud API endpoints.
- Security boundary: All Cloud API requests for the PDP MUST run on the server
  (Server Components or server route handlers). Client components must never
  call Cloud API directly.
- No inventory reservations or guarantees.

## Assumptions
- Cloud API provides product read models via GET /read/products.
- For v1, the route param [slug] is the Cloud read-model product id (string).
- Price may be unavailable (null) in read models and must be handled gracefully.

## Acceptance summary
- /{locale}/product/[slug] renders a product detail page with safe states.
- Product not found results in a 404/notFound state.
- Cloud API failure shows a friendly error state without crashing the app shell.
- All user-visible strings are localized (including metadata).
