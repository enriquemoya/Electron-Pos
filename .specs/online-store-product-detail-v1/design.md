## Routing
- PDP lives under locale scope:
  - /{locale}/product/[slug]
  - Example: /es/product/prod-001
- The [slug] param is a stable identifier string. In v1 it maps to the Cloud read-model product id.

## Page responsibilities
PDP must:
- Fetch and render a single product (read-only).
- Display semantic availability state only.
- Display optional enrichment fields when present.
- Render related products (best-effort).

PDP must not:
- Mutate inventory or create orders.
- Add cart state or implement checkout.

## Data sources
### Primary product fetch
Use the existing Cloud API read endpoint:
- GET /read/products?id={slug}&page=1&pageSize=1

Expected minimal response shape (from current online-store api.ts contract):
{
  items: [
    {
      id: string,
      name: string,
      shortDescription: string | null,
      category: string | null,
      game: string | null,
      price: { amount: number, currency: string } | null,
      imageUrl: string | null,
      state: "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT" | "PENDING_SYNC" | null
    }
  ],
  page: number,
  pageSize: number,
  total: number
}

Selection rules:
- If items is empty: notFound().
- Use items[0] as the product.

### Related products (best-effort)
Goal: show a small set of related items (same game preferred, otherwise same category).

Fetch strategy (no new API required):
- GET /read/products?page=1&pageSize=24
- Filter in-memory:
  - Exclude current product id
  - Prefer same game (exact string match)
  - Otherwise same category (exact string match)
  - If both game and category are missing, render an empty related section

Render up to 6 related items.

## Availability semantics
Availability is semantic only; do not show quantities or make guarantees.

Mapping:
- state = AVAILABLE  -> availability label key: availability.inStock
- state = LOW_STOCK  -> availability label key: availability.lowStock
- state = SOLD_OUT   -> availability label key: availability.outOfStock
- state = PENDING_SYNC or null -> availability label key: availability.pendingSync

## Layout (mobile-first)
### Mobile
Stacked layout:
1) Product media
2) Title + badges (game, category) + availability badge
3) Price (if present)
4) Short description (if present)
5) Related products

### Desktop
Two-column layout:
- Left: product media
- Right: title, badges, availability, price, description
- Related products full-width below

## Component architecture
Use existing shared components where possible (Header/Nav, ProductCard, Inventory badge).
Define PDP-specific components under online-store components:
- ProductDetailShell
- ProductMedia
- ProductHeader
- ProductBadges (game + category)
- ProductPrice
- ProductDescription
- RelatedProductsGrid
- ProductDetailSkeleton
- ProductDetailErrorState

## Error and empty states
PDP must be resilient and never crash the app shell.

Cases:
- Product not found:
  - Trigger notFound() and render the standard 404 route UI.
- Cloud API unreachable or non-200:
  - Render ProductDetailErrorState with a localized message and a link back to catalog.
- Optional fields missing (imageUrl, category, game, shortDescription, price):
  - Do not drop the product.
  - Hide the missing field block or show a localized fallback (only where it improves clarity).

## Loading states
Provide a skeleton loading state for PDP:
- Use Next.js route-level loading.tsx for /product/[slug]
- Skeleton should match final layout (media + text blocks)

## Metadata
Metadata must be localized and must not be English-only by default.

Rules:
- Title: use product name when present; otherwise a localized fallback key.
- Description: prefer shortDescription when present; otherwise a localized fallback key.
- Do not include stock guarantees in metadata.

## i18n key map (PDP)
productDetail:
- productDetail.titleFallback
- productDetail.descriptionFallback
- productDetail.priceLabel
- productDetail.priceUnavailable
- productDetail.categoryLabel
- productDetail.gameLabel
- productDetail.relatedTitle
- productDetail.relatedEmpty
- productDetail.errorTitle
- productDetail.errorBody
- productDetail.backToCatalog
- productDetail.imageAlt

availability:
- availability.inStock
- availability.lowStock
- availability.outOfStock
- availability.pendingSync

games (labels for badges):
- games.pokemon
- games.onePiece
- games.yugioh
- games.other

## Accessibility
- Product image must have meaningful alt text (localized).
- Badges and labels must have sufficient contrast in dark theme.
- Headings must follow a clear hierarchy (h1 for product name, h2 for related section).
- Interactive elements (links) must be keyboard reachable with visible focus.

## Acceptance criteria
- PDP route exists under /{locale}/product/[slug].
- Product renders with name, availability badge, and image (or placeholder when missing).
- No quantities are shown.
- Related products section renders up to 6 items or shows an empty state.
- All user-visible strings (including metadata) are localized via next-intl.

