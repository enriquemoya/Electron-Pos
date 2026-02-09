# Requirements: Inventory Admin Dashboard v1

## Problem statement
The online store needs an authenticated admin area to manage inventory and
catalog data and to view operational summaries while public catalog access
remains read only and non authoritative.

## Goals
- Provide an admin dashboard at /admin/home with operational summaries.
- After successful admin login, redirect to /admin/home.
- Enable admin users to manage inventory quantities.
- Record inventory adjustments with reason, actor, and timestamp.
- Enable admin management of catalog entities (products, categories, games,
  expansions, and other taxonomies).
- Allow admin product creation with validated slug and required fields.
- Enforce taxonomy dependency-safe product editing:
  - game optional
  - expansion depends on selected game
  - category options depend on game/expansion selection context
- Expose explicit availability state selection on admin product create/edit forms.
- Provide search and pagination for admin lists (inventory, products, taxonomies).
- Keep public catalog read only and expose semantic availability only.

## Scope
- Cloud API admin endpoints for inventory, catalog, and summary data.
- Prisma schema additions for inventory adjustments and catalog taxonomies.
- Online store admin UI for dashboard and management pages.

## Non goals
- No POS sync.
- No cart, checkout, payments, or shipping integrations.
- No customer facing UI changes beyond admin area.

## Constraints
- Admin only access via JWT auth (email only flow already defined).
- Public catalog must never expose raw inventory quantities.
- Inventory mutations must be server side only and require admin role.
- All inventory and product mutations must write an audit log (reason, actor, timestamp).
- Prisma is the only data access layer.
- Schema changes must be additive and forward only.
- Product taxonomy constraints:
  - if game is not selected, expansion must be null
  - category must always be selected
  - category options must be filtered by selected game/expansion context

## i18n
- All admin UI strings must be localized with next-intl.

## Error handling
- Admin endpoints return safe, non sensitive errors.
- Validation errors must be explicit and consistent.

## Validation
- Validate pagination inputs on list endpoints.
- Validate inventory adjustment deltas and reasons.
- Validate taxonomy names and product fields.
- Validate product slug uniqueness.
