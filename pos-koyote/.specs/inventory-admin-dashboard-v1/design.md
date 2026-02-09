# Design: Inventory Admin Dashboard v1

## High level architecture
- Cloud API exposes admin endpoints for inventory, catalog, and summary data.
- Online store admin UI consumes Cloud API server side only.
- Public catalog continues to use read model inventory and semantic availability.

## Data model additions
### InventoryAdjustment
- id (uuid)
- productId (string)
- delta (int)
- reason (string)
- actorUserId (uuid)
- previousQuantity (int)
- newQuantity (int)
- createdAt (timestamp)

### CatalogTaxonomy
- id (uuid)
- type (CATEGORY | GAME | EXPANSION | OTHER)
- name (string)
- slug (string, unique)
- description (string, optional)
  - createdAt, updatedAt

### CatalogAuditLog
- id (uuid)
- entityType (PRODUCT | TAXONOMY)
- entityId (string)
- action (CREATE | UPDATE | DELETE)
- actorUserId (uuid)
- reason (string)
- payload (json, optional)
- createdAt (timestamp)

## Existing data usage
- ReadModelInventory is used as the admin editable product inventory source.
- Public catalog derives semantic availability from ReadModelInventory.available.
- Admin inventory mutations update ReadModelInventory.available.

## API contracts (Cloud API)
All endpoints are under /admin and require JWT with role=ADMIN.

### Dashboard
- GET /admin/dashboard/summary
  - response: { pendingShipments: number, onlineSalesTotal: number, currency: string }
  - pendingShipments counts orders with status = "CREATED".
  - onlineSalesTotal sums order payload totals when present (0 if none).

### Inventory
- GET /admin/inventory
  - query: page, pageSize
  - response: { items, page, pageSize, total, hasMore }
  - items include productId, name, category, game, available, price, imageUrl.
- POST /admin/inventory/:productId/adjust
  - body: { delta: number, reason: string }
  - response: { item, adjustment }

### Catalog products (ReadModelInventory)
- GET /admin/catalog/products
- GET /admin/catalog/products/:productId
- POST /admin/catalog/products
- PATCH /admin/catalog/products/:productId
  - editable fields: displayName, slug, category, categoryId, expansionId, game,
    price, imageUrl, shortDescription, description, rarity, tags, availabilityState,
    isFeatured, featuredOrder, isActive
  - requires reason for audit log

Create payload (required):
- name, slug, categoryId, price, imageUrl
Optional:
- gameId, expansionId, description, rarity, tags, isActive, isFeatured, featuredOrder
Derived:
- availabilityState, available

Taxonomy-dependent product form behavior:
- gameId is optional (`gameNone` option).
- expansion selector is disabled until gameId is selected.
- category selector is always required.
- category options are loaded dynamically using taxonomy scope:
  - gameId=null -> categories from misc scope
  - gameId set, expansionId null -> categories for game scope
  - gameId set, expansionId set -> categories for expansion scope plus valid game scope
- invalid dependent values are cleared when parent selection changes.

Availability state:
- Product create/edit includes explicit availabilityState selector with:
  - AVAILABLE
  - LOW_STOCK
  - OUT_OF_STOCK
  - PENDING_SYNC

Search and pagination:
- list endpoints accept query, page, pageSize, sort, direction.
- query matches name, slug, game, category name (case insensitive).
- pageSize options: 20, 50, 100.
- default pageSize: 20.

### Catalog taxonomies
- GET /admin/catalog/taxonomies?type=...
- POST /admin/catalog/taxonomies
- PATCH /admin/catalog/taxonomies/:id
- DELETE /admin/catalog/taxonomies/:id
  - list supports query, page, pageSize, sort, direction.
  - pageSize options: 20, 50, 100.
  - create/edit uses modal with dependency-safe selectors:
    - CATEGORY supports game + optional expansion parent
    - EXPANSION requires game parent
    - releaseDate required for expansion

## Auth and security
- Admin endpoints require Authorization: Bearer <access token>.
- Online store admin routes use server side guard and never expose secrets.

## Admin UI routes
- /[locale]/admin/home
- /[locale]/admin/inventory
- /[locale]/admin/products
- /[locale]/admin/taxonomies
- /[locale]/admin/products/new

## Admin login redirect
- After successful admin login, redirect to /{locale}/admin/home.

## Admin UX
- /admin/home shows summary cards and navigation tiles.
- Inventory list supports pagination and adjust dialog.
- Catalog products list supports create, search, pagination, and edit.
- Taxonomy management supports search, pagination, create, and edit.
- Product create form auto-suggests slug from name and allows manual override.
- Search inputs debounce client updates before submitting query params.

## Edge cases
- Adjusting inventory for missing product returns 404.
- Negative inventory allowed? No. Clamp to 0 and record actual delta.
- If orders table has no matching rows, dashboard values are 0.
