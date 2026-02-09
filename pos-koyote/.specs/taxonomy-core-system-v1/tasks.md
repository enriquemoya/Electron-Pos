# taxonomy-core-system-v1 tasks

## Phase 1: Data model and migrations
1. Add catalog_taxonomies.parent_id (nullable UUID) and labels JSON column.
2. Add catalog_taxonomies.release_date (nullable Date, required for EXPANSION at validation level).
3. Add read_model_inventory.game_id (nullable UUID) and indexes for game_id and category_id.
4. Create migration to backfill:
   - parent_id for EXPANSION taxonomies.
   - game_id, category_id, expansion_id for products where possible.
   - default misc category assignment for products without category_id.
5. Acceptance criteria before enforcing category_id non-null:
   - No read_model_inventory rows have category_id null.
   - Default misc category exists and is assigned where needed.
6. Enforce read_model_inventory.category_id as required (non-null) only after acceptance criteria pass.
7. Add integrity checks in Prisma layer for taxonomy relationships:
   - EXPANSION must reference GAME and include release_date
   - CATEGORY parent may be GAME or EXPANSION only

## Phase 2: Cloud API taxonomy endpoints
1. Implement GET /catalog/taxonomies/games.
2. Implement GET /catalog/taxonomies/categories with optional gameId and expansionId filters.
3. Implement GET /catalog/taxonomies/expansions with optional gameId filter.
4. Return labels object { es, en } and releaseDate; keep API locale-agnostic.
5. Update catalog read endpoints to accept taxonomy ID filters (categoryId, gameId, expansionId) plus price/pagination filters.
6. Enforce query param validation and return 400 on invalid filters.
7. Ensure taxonomy read endpoints are public and admin mutations remain JWT + admin only.
8. Add online-store proxy endpoints for client-side combobox dependencies:
   - /api/taxonomies/games
   - /api/taxonomies/categories
   - /api/taxonomies/expansions

## Phase 3: Online-store integration
1. Fetch taxonomy lists server-side in header and catalog pages.
2. Build header menus dynamically from taxonomy payloads with hierarchy:
   - game -> expansions -> categories
   - game -> others -> categories without expansion
3. Limit menu expansions per game to latest 5 by releaseDate desc.
4. Build shared "Categories" entry using categories that appear in more than one game.
5. Replace hardcoded filter options with taxonomy-derived options.
6. Implement combobox-based selectors for filters on desktop and mobile.
7. Add expansion filter selector to both desktop and mobile filters.
8. Add humanized clear options per selector (all games/categories/expansions/misc).
9. Implement path-based routing for catalog taxonomy navigation:
   - /[locale]/catalog
   - /[locale]/catalog/{gameSlug}
   - /[locale]/catalog/{gameSlug}/{expansionSlug}
   - /[locale]/catalog/{gameSlug}/{categorySlug}
   - /[locale]/catalog/{gameSlug}/{categorySlug}/{expansionSlug}
   - /[locale]/catalog/misc
10. Ensure URL query params are used only for secondary filters.
11. Add empty-state behavior when taxonomies are missing.
12. Implement taxonomy modal create/edit with dependency-aware selectors.
13. Implement product create/edit taxonomy selectors with dynamic dependency loading.

## Phase 4: Validation and QA
1. Verify taxonomy endpoints return correct localized labels.
2. Verify menu construction matches taxonomy data only.
3. Verify catalog routing reflects path-based taxonomy navigation.
4. Verify catalog filters reflect URL query params and taxonomy data.
5. Verify no hardcoded menu items remain in online-store.
6. Verify expansion release date ordering is respected in menu.
7. Verify product forms enforce game/expansion/category dependency rules.
