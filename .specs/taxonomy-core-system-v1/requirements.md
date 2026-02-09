# taxonomy-core-system-v1 requirements

## Problem statement
Catalog navigation, filters, and header menus are currently built from hardcoded values
and free-text filters. This creates drift between UI navigation and actual catalog data,
causes inconsistent URLs, and makes taxonomy maintenance error-prone.

## Goals
- Make taxonomies the single source of truth for catalog navigation and filters.
- Build header menus dynamically from taxonomy data (games, expansions, categories, misc).
- Drive catalog filters exclusively from taxonomy data and URL query params.
- Ensure taxonomy labels are localizable and rendered via next-intl in the online store.
- Keep the public catalog read-only and inventory-free in this spec.
- Provide a misc taxonomy path for products without a gameId.
- Support taxonomy dependency-aware admin UX for create/edit flows.
- Use expansion release date to sort expansion visibility in navigation.

## Scope
- cloud-api: read-only taxonomy endpoints and catalog filter inputs based on taxonomies.
- data (Prisma): taxonomy relationships and product taxonomy references.
- online-store: menu and filter UI sourced from taxonomy endpoints and URL params.
- online-store admin: taxonomy and product forms constrained by taxonomy dependencies.

## Non-goals
- No inventory mutations or inventory sync changes.
- No cart or checkout changes.
- No POS or Electron changes.
- No admin UI redesign beyond what is strictly needed for taxonomy data integrity.

## Constraints
- Public catalog remains read-only and non-authoritative for inventory quantities.
- No hardcoded menu items or free-text filters in the online store.
- Online store locale is URL-only (/es, /en) with default locale es.
- All user-visible text must be localized using next-intl.
- Cloud API uses Prisma as the only data access layer.
- Taxonomy read endpoints are public and must not require x-cloud-secret.
- Admin taxonomy mutations require JWT + admin role.
- Path-based routing is the source of truth for taxonomy navigation.
- Query params are secondary filters only (price, sort, availability, pagination).
- CATEGORY may be global (parentId null), game-scoped (parentId=GAME), or expansion-scoped (parentId=EXPANSION).
- EXPANSION must always have parent GAME and must include releaseDate.
- Header menu composition:
  - Game entry
  - Expansion sections (latest 5 by releaseDate desc)
  - "Others" section with game-scoped categories that are not expansion-scoped
  - Separate "Categories" entry for categories shared by more than one game
  - Separate "Misc" entry for products with gameId null
- Catalog filters must use shadcn combobox-based selectors on desktop and mobile:
  - games, categories, expansions, misc
  - each selector includes a humanized "all/clear" option
- Expansion filter must be available in both mobile and desktop filter surfaces.
- Product admin forms must enforce taxonomy dependencies:
  - gameId optional
  - expansion disabled when gameId is not selected
  - categories loaded dynamically by selected game/expansion context

## Assumptions
- Catalog taxonomies already exist in the database and can be extended.
- Admin workflows exist to manage taxonomies and products with dependency-safe selectors.
- Products already reference category and expansion data in read models.

## i18n requirements
- Taxonomy labels must be localizable for es and en.
- Cloud API is locale-agnostic and returns labels as {es, en}.
- Online-store resolves locale via next-intl and selects the proper label.
- When a localized label is missing, the UI must fall back to the canonical name.

## Error handling
- Invalid taxonomy query parameters return 400 with a stable error message.
- Missing taxonomy data returns an empty list (200) rather than server errors.
- Invalid taxonomy relationships (for example expansion without a valid parent game)
  are ignored in public responses and logged server-side.
- Taxonomy client proxy failures return safe upstream errors without exposing secrets.

## Out of scope
- Any payment or checkout-related changes.
- Any POS synchronization or inventory reservation changes.
