# Runtime Evidence - Snapshot to UI Taxonomy Parity

- Date/time (UTC): 2026-02-20T05:11:31Z
- appEnv: prod
- branchId: c3df9d36-30a4-4ca5-8c5e-6f0a162053f4
- terminalId: cmlt38rvi000312mbawgmt2ve

## Steps Executed
1. Verified active terminal and branch from cloud DB sample.
2. Verified local SQLite projection tables exist: categories, game_types, expansions, products.
3. Queried local sync state and local projection counts.
4. Attempted screenshot capture for POS window.

## Expected vs Observed

### A) Snapshot completes and projection applies CATEGORY/GAME/EXPANSION/PRODUCT
- Expected: snapshot runtime evidence shows taxonomy entity projection counts from sync payload.
- Observed:
  - `pos_sync_state.catalog_snapshot_version` present (`2026-02-07T04:52:42.503Z`).
  - Local projection tables contain rows: categories=1, game_types=1, expansions=1, products=1.
  - `catalog_meta` currently shows only PRODUCT rows (`entity_type=PRODUCT count=1`).
- Result: PARTIAL. Projection tables populated, but raw sync metadata does not yet prove taxonomy entities arrived in snapshot payload at runtime.

### B) Category picker dynamic visibility (enabledPOS only)
- Expected: category picker populated dynamically from SQLite and hides disabled categories.
- Observed: code path is dynamic (`window.api.categories.listCategories(true)`), but runtime UI screenshot evidence is missing in this environment.
- Result: NOT VERIFIED at runtime in this run.

### C) Uncategorized product behavior
- Expected: product with `categoryCloudId=null` displays `Uncategorized`.
- Observed: local DB has `products_null_category=0`; no uncategorized sample product present.
- Result: BLOCKED by dataset precondition.

### D) Game + expansion picker from projected tables
- Expected: expansion options resolve by selected game from projected tables.
- Observed: local projection tables contain game_types=1 and expansions=1; runtime UI screenshot not captured.
- Result: PARTIAL (data present, UI proof missing).

## Logs Snippet (redacted)
- Cloud sample and local state evidence:
  - `taxonomyCounts`: CATEGORY=3, GAME=3, EXPANSION=1 (cloud DB)
  - `catalog_meta_by_entity_type`: PRODUCT=1 (local)
  - `pos_sync_state.last_delta_sync_at`: `2026-02-20T05:10:03.381Z`

## Screenshots Referenced
- `/Users/enriquemoya/Documents/GitHub/Electron-Pos/artifacts/pos-sync/pos-sync-taxonomy-parity-v1/runtime/screens/electron-products-fullscreen.png` (capture failed in headless environment)
- `/Users/enriquemoya/Documents/GitHub/Electron-Pos/artifacts/pos-sync/pos-sync-taxonomy-parity-v1/runtime/screens/README.md`
