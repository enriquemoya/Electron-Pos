# pos-sync-catalog-projection-v1 - Tasks

## Phase 1 - Discovery and Mapping
- Identify all local SQLite tables used by POS UI for products, taxonomies, games, expansions, and pricing.
- Identify IPC and repository read paths used by new-sale, products, and inventory pages.
- Confirm which paths currently read catalog_meta versus domain tables.
- Output a mapping doc for cloud entityType to local table and columns.

## Phase 2 - SQLite Schema Extensions
- Add additive SQLite migration scripts for projection metadata:
  - cloudId UNIQUE
  - enabledPOS
  - enabledOnlineStore
  - cloudUpdatedAt
  - isDeletedCloud or deletedAt
  - versionHash
- Add missing indexes for cloudId and enabledPOS filters.
- Keep existing local IDs and historical sales references intact.

## Phase 3 - Projection Layer Implementation
- Create projection module under desktop sync integration.
- Implement transactional snapshot projection algorithm.
- Implement transactional delta projection algorithm.
- Add version guard to prevent epoch or invalid snapshotVersion regression.
- Return structured projection stats: inserted, updated, disabled, deleted.

## Phase 4 - Sync Engine Wiring
- Update sync engine to call projection layer after snapshot and delta fetch.
- Persist sync state only after successful projection transaction.
- Preserve offline-first behavior and non-blocking startup on sync failures.

## Phase 5 - Repository and IPC Consumption Updates
- Update POS repositories to read projected domain tables using filters:
  - enabledPOS=true
  - not deleted in cloud
- Ensure sell flow uses the same filtered repositories.
- Keep historical sales detail rendering unaffected for disabled products.

## Phase 6 - Reconcile Flow
- Keep manual reconcile button wiring through inventory-sync IPC.
- Build manifest from projected rows by cloudId and entityType.
- Apply reconcile plan using projection delta pathway.
- Emit reconcile stats and stable errors.

## Phase 7 - Tests and Runtime Validation
- Add automated tests or runtime scripts for:
  - snapshot projection into UI-visible tables
  - delta enable and disable changes reflected in UI queries
  - delta delete marker handling
  - reconcile missing and stale repair
  - version regression guard against epoch value
- Add deterministic local test script for dev.

## Phase 8 - Governance and Build Gates
- Run spec audit:
  - npm run gov:spec:audit -- "pos-sync-catalog-projection-v1"
- After implementation run builds:
  - npm run build -w apps/desktop
  - npm run build -w apps/cloud-api
  - npm run build -w apps/online-store
- Run implementation audit:
  - npm run gov:impl:audit -- "pos-sync-catalog-projection-v1"
