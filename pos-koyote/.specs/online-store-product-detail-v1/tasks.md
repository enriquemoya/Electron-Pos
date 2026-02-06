## Phase 1 - Routing
- Add PDP route under locale scope:
  - apps/online-store/src/app/[locale]/product/[slug]/page.tsx
- If an older id-based route exists, align it to [slug] naming without changing semantics.

## Phase 2 - Data wiring
- Implement product fetch using Cloud API read models:
  - GET /read/products?id={slug}&page=1&pageSize=1
- Implement selection rules:
  - If no items returned: notFound()
  - Else use items[0]
- Implement related products fetch:
  - GET /read/products?page=1&pageSize=24
  - Filter in-memory per spec and render up to 6 items

## Phase 3 - Components
- Add PDP components:
  - ProductDetailShell
  - ProductMedia
  - ProductHeader
  - ProductBadges
  - ProductPrice
  - ProductDescription
  - RelatedProductsGrid
  - ProductDetailSkeleton
  - ProductDetailErrorState
- Reuse existing header/nav and ProductCard where possible.

## Phase 4 - States
- Add route-level loading.tsx with ProductDetailSkeleton.
- Add localized error state for Cloud API failures.
- Ensure optional fields (imageUrl, game, category, shortDescription, price) do not break rendering.

## Phase 5 - i18n
- Add required translation keys for:
  - PDP UI strings
  - PDP metadata fallbacks
  - Image alt text
- Implement generateMetadata for the PDP route:
  - Locale-aware title and description
  - Use product fields when present, with translation fallback keys when missing
- Verify no hardcoded user-visible strings in JSX.

## Phase 6 - Accessibility
- Validate heading order and semantics.
- Validate focus states for all interactive elements.
- Ensure badges and text meet contrast expectations for dark theme.

## Phase 7 - Validation
- Verify mobile-first layout and responsive desktop layout.
- Verify notFound behavior for unknown slugs.
- Verify Cloud API failure renders an error state without crashing the app.
- Verify related products filtering rules and max 6 items.
