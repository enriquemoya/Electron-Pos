# Online Store Landing Page v1

## Goals
- Provide a marketing focused entry page for the online store.
- Explain the Koyote Games brand and core TCG focus.
- Highlight featured products using read only cloud data.
- Promote community, events, and tournaments awareness.
- Drive users into the catalog and game specific views.

## Users
- New visitors seeking a quick brand overview.
- Returning customers looking for featured products.
- Community members looking for events and news.
- Mobile first shoppers on phones and tablets.

## Scope
- Landing page layout and section behaviors only.
- Marketing content and CTAs.
- Featured products section using cloud read models.
- Game highlights for Pokemon, One Piece, Yu-Gi-Oh, Others.
- Community and news teaser section.
- Reusable UI component definitions for landing use.

## Non Goals
- Header and main navigation (covered by separate spec).
- Cart, checkout, or payment flows.
- Authentication or user accounts.
- POS or Electron integration.
- Inventory guarantees or reservations.
- Admin or CMS tooling.

## Constraints
- Online store is read only.
- All data access via Cloud API read endpoints.
- No direct database access from the frontend.
- Dark theme only. No glassmorphism.
- Tailwind and shadcn/ui only.
- Mobile first is mandatory.
- Components must be reusable across landing and catalog.

## i18n
- URL based locales only (/es default, /en).
- No browser or IP auto detection.
- All user visible text uses translation keys.
- No hardcoded strings in JSX.

## Error Handling
- Featured products section must handle empty or error states.
- Cloud API failures must render friendly, non blocking messages.
- No hard crash on missing optional data.
- The landing page must never fully error.
- Each section handles its own empty or error state independently.
- Other sections must render safely with static content if data is unavailable.
