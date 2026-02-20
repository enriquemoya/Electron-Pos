# pos-sync-taxonomy-parity-v1 - Tasks

## Phase 1 - Contract Verification
- [ ] Inspect current cloud sync payload contract for PRODUCT, GAME, EXPANSION, CATEGORY coverage.
- [ ] Confirm enabledPOS and enabledOnlineStore flag availability in payload.
- [ ] If taxonomy entities are missing, define additive cloud-api contract extension.
- [ ] Confirm branch scoping behavior remains terminal-derived.

## Phase 2 - SQLite Schema and Migration
- [ ] Add additive SQLite taxonomy parity schema updates for categories, game_types, expansions, and product taxonomy references.
- [ ] Add cloudId unique indexes per taxonomy table.
- [ ] Add enabledPOS and deletion filter indexes for read paths.
- [ ] Define safe backfill for legacy local rows without cloudId.

## Phase 3 - Projection Implementation
- [ ] Extend projection materializer to handle CATEGORY, GAME, EXPANSION, and PRODUCT entity types.
- [ ] Implement transactional snapshot projection per entityType.
- [ ] Implement idempotent delta projection per entityType.
- [ ] Add stable validation errors for unsupported or malformed taxonomy rows.
- [ ] Enforce version guard to prevent epoch or regressive overwrite.

## Phase 4 - UI Wiring
- [ ] Replace hardcoded category select source with dynamic categories from SQLite projection.
- [ ] Ensure game and expansion selectors read projected taxonomy records.
- [ ] Apply enabledPOS and not-deleted filtering in product and taxonomy queries.
- [ ] Add minimal empty state for missing taxonomy data.

## Phase 5 - Reconcile
- [ ] Keep reconcile action on existing inventory sync IPC flow.
- [ ] Send local mapping summary by entityType.
- [ ] Apply reconcile corrections via safe projection path.
- [ ] Ensure reconcile does not block sales flow or corrupt history.

## Phase 6 - Tests and Gates
- [ ] Validate first snapshot populates dynamic category picker and taxonomy labels.
- [ ] Validate delta enable or disable behavior updates picker and sellability.
- [ ] Validate version guard prevents epoch regression overwrite.
- [ ] Validate historical sales remain readable when taxonomy becomes disabled.
- [ ] Run builds:
  - [ ] npm run build -w apps/desktop
  - [ ] npm run build -w apps/cloud-api
  - [ ] npm run build -w apps/online-store
  - [ ] npm run build -w apps/web
- [ ] Run implementation audit:
  - [ ] npm run gov:impl:audit -- "pos-sync-taxonomy-parity-v1"
- [ ] Run guard searches:
  - [ ] rg -n "console\\.(log|warn|error)" apps/desktop apps/cloud-api/src -S
  - [ ] rg -n "categoryTCGSealed|categoryTCGSingle|categoryAccessory|categoryCommodity|categoryService" apps/web/src -S

## Spec Audit Command
- [ ] npm run gov:spec:audit -- "pos-sync-taxonomy-parity-v1"
