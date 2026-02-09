## Purpose
Define the v1 catalog listing page for the online store as a read-only,
filterable grid that surfaces products from the Cloud API.

## Goals
- Provide a mobile-first catalog grid with filters and pagination.
- Show availability as labels only with no stock guarantees.
- Support optional price range filtering via a slider.
- Use API-driven category and game filters with no free-text input.
- Reuse existing header/navigation without re-implementation.
- Keep all user-visible text localized via next-intl.

## Non-goals
- No product detail page work.
- No cart or checkout logic.
- No authentication or user accounts.
- No admin or CMS tooling.
- No POS or Electron changes.
- No write operations or admin changes in Cloud API.

## Scope
In scope:
- Catalog listing page only:
  - Grid layout
  - Filters
  - Sorting
  - Pagination
- Active filter chips above the grid.
- Loading, empty, and error states.
- Component reuse from landing where applicable.

Out of scope:
- Product detail page.
- Landing page changes.
- Header and main navigation (reuse existing spec).

## Constraints
- Online-store UI plus read-only Cloud API metadata for filters.
- Read-only data access via Cloud API catalog endpoints.
- Price range filter uses URL query params priceMin and priceMax.
- Category and game filters must be sourced from the Cloud API only.
- Hardcoded taxonomy values are forbidden in the UI.
- URL-based locales only (/es default, /en).
- Dark theme only, no glassmorphism.
- Tailwind + shadcn/ui only.
- No hardcoded user-visible strings in JSX.
- Availability semantics are non-guaranteed labels only.

## Assumptions
- Catalog endpoint exists and is read-only.
- Catalog filters endpoint exists and is read-only.
- Header and navigation are already implemented and reused.

## Acceptance summary
- Catalog grid renders across mobile and desktop.
- Filters and sorting update listing without breaking layout.
- Pagination is functional and accessible.
- Section-level loading, empty, and error states are present.
