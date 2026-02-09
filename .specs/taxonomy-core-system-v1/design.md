# taxonomy-core-system-v1 design

## High-level architecture
- cloud-api exposes read-only taxonomy endpoints.
- online-store fetches taxonomy data server-side and builds navigation and filters dynamically.
- URL path segments are the source of truth for taxonomy navigation.
- URL query params are used only for secondary filters (price, sort, availability, pagination).

## Data model
### CatalogTaxonomy
- Existing table: catalog_taxonomies
- Extend with:
  - parentId (UUID, nullable)
    - Used to link Expansion -> Game
    - Used to link Category -> Game or Category -> Expansion
  - labels (JSON, nullable)
    - Map of locale to label, for example {"es":"Pokemon","en":"Pokemon"}
  - releaseDate (Date, nullable)
    - Required for EXPANSION
- Types:
  - GAME (root)
  - CATEGORY (global or scoped)
  - EXPANSION (child of GAME via parentId)
  - OTHER (reserved, not used in this spec)

### ReadModelInventory
- categoryId REQUIRED (already present, enforce non-null at schema level).
- gameId OPTIONAL (new, nullable).
- expansionId OPTIONAL (already present, nullable).
- category and game string fields remain as derived display fields for legacy compatibility.
- categoryId enforcement must be applied only after a successful backfill.

### Relationship rules
- Expansion must reference a valid Game via parentId.
- Expansion releaseDate is required.
- Category parent is optional:
  - null for global/misc categories
  - GAME id for game-scoped categories
  - EXPANSION id for expansion-scoped categories
- Product categoryId must reference a CATEGORY taxonomy.
- Product gameId (if set) must reference a GAME taxonomy.
- Product expansionId (if set) must reference an EXPANSION taxonomy whose parentId equals gameId.
- Products with no gameId are treated as misc.
- Misc products may have categoryId but must not have expansionId.

## API contracts (cloud-api)
Read-only endpoints:
- GET /catalog/taxonomies/games
- GET /catalog/taxonomies/categories?gameId=...&expansionId=...
- GET /catalog/taxonomies/expansions?gameId=...

Security boundaries:
- Taxonomy read endpoints are public (no x-cloud-secret).
- Admin taxonomy mutations require JWT + admin role.

Response shape (all endpoints):
- items: Array of
  - id: string
  - slug: string
  - type: "GAME" | "CATEGORY" | "EXPANSION"
  - name: string (canonical)
  - labels: { es: string | null, en: string | null }
  - parentId: string | null
  - releaseDate: string | null (YYYY-MM-DD, nullable except EXPANSION)

Localization rules:
- Cloud API is locale-agnostic and returns labels object.
- Online-store selects labels[locale], falling back to name.

Catalog read endpoint updates:
- read/products supports taxonomy-based filters (query params):
  - gameId?, categoryId?, expansionId?, priceMin?, priceMax?, page?, pageSize?
- Absence or null = no filter.
- Server-side validation required for all query params.
- Legacy free-text filters are deprecated and should be removed from UI usage.

Online-store proxy endpoints for client-side selectors:
- GET /api/taxonomies/games
- GET /api/taxonomies/categories?gameId=...&expansionId=...
- GET /api/taxonomies/expansions?gameId=...
- Proxy is server-side and forwards to cloud-api public taxonomy endpoints.

## Online-store behavior
### Header/menu
- Games entry list is built from GAME taxonomies.
- For each selected game:
  - Show latest 5 EXPANSION entries by releaseDate desc (fallback name asc).
  - Under each expansion show expansion-scoped categories.
  - Show "Others" section with game-scoped categories (parent GAME).
- "Categories" entry shows only categories shared by more than one game.
- "Misc" entry navigates to /catalog/misc.

### Catalog filters
- Filter options are loaded from taxonomy endpoints.
- Filters use shadcn combobox selectors on desktop and mobile.
- Filter groups:
  - games
  - categories
  - expansions
  - misc
- Every selector includes humanized clear option:
  - all games
  - all categories
  - all expansions
  - all misc
- Taxonomy navigation is driven by path segments:
  - /[locale]/catalog
  - /[locale]/catalog/{gameSlug}
  - /[locale]/catalog/{gameSlug}/{categorySlug}
  - /[locale]/catalog/{gameSlug}/{expansionSlug}
  - /[locale]/catalog/{gameSlug}/{categorySlug}/{expansionSlug}
  - /[locale]/catalog/misc
- Query params are used only for secondary filters.

### Admin taxonomy/product dependency UX
- Taxonomy create/edit uses modal dialogs with dependency-aware selectors.
- Type-dependent behavior:
  - GAME/OTHER: no parent dependencies
  - EXPANSION: requires parent GAME and releaseDate (year/month selector)
  - CATEGORY: can select GAME and optional EXPANSION under that game
- Dependency selectors are dynamic:
  - selecting a game fetches its expansions
  - changing taxonomy type clears invalid dependent selections
- Product create/edit forms:
  - gameId optional ("no assigned game")
  - expansion selector disabled until gameId exists
  - categories fetched dynamically by game/expansion context
  - if no gameId, categories are loaded from misc scope
  - availabilityState is explicitly selectable (AVAILABLE, LOW_STOCK, OUT_OF_STOCK, PENDING_SYNC)

## Data flow
1. Online-store server component requests taxonomy lists from cloud-api.
2. UI builds menus and filter options from taxonomy data.
3. User navigates via taxonomy path segments.
4. Catalog fetch uses taxonomy IDs resolved from path and secondary query params.

## State ownership
- Taxonomy data: cloud-api + data (Prisma) authoritative.
- Navigation state: URL path segments.
- Filter state: URL query parameters (secondary filters only).
- UI state: derived from URL + taxonomy payload.

## Error and edge cases
- Missing taxonomy data -> render empty lists and no menu items.
- Expansion without valid parent -> excluded from API responses.
- Invalid category parent relationships -> excluded from scoped navigation/rendering.
- Product with missing categoryId -> excluded from catalog listing unless assigned to misc in backfill.
- Missing label translation -> fallback to name.

## i18n and accessibility
- All menu and filter labels pass through next-intl or localized labels from API.
- Menus and dropdowns must maintain keyboard navigation and accessible roles.
