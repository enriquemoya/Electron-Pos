# Tasks: Inventory Admin Dashboard v1

## Phase 1: Schema
1. Add InventoryAdjustment model.
2. Add CatalogTaxonomy model + enum.
3. Create Prisma migration and generate client.

## Phase 2: Cloud API
1. Add admin dashboard summary endpoint.
2. Add inventory list and adjust endpoints.
3. Add catalog products list/get/create/update endpoints.
4. Add taxonomy CRUD endpoints with search/pagination.
5. Add validation for inventory adjustments and catalog payloads.
6. Add catalog audit log entries for product mutations.

## Phase 3: Online store admin UI
1. Add /admin/home dashboard page with summary cards and nav tiles.
2. Add /admin/inventory list + adjust modal.
3. Add /admin/products list + create + edit.
4. Add /admin/taxonomies list + create/edit.
5. Add translations for all admin UI strings.
6. Implement dynamic taxonomy dependency selectors in product create/edit:
   - optional game selector
   - expansion selector enabled only with selected game
   - category selector loaded by game/expansion context
7. Add availabilityState selector to product create/edit forms.
8. Implement taxonomy modal dependency behavior for create/edit:
   - type-driven parent selectors
   - expansion requires game parent and releaseDate
   - clear/reset dependent fields when type changes

## Phase 4: QA
1. Verify admin routes require JWT role=ADMIN.
2. Verify public catalog still exposes semantic availability only.
3. Verify inventory adjustment creates audit entry.
4. Verify product form dependency validation prevents invalid taxonomy combinations.
5. Verify availabilityState updates persist correctly in read model.
