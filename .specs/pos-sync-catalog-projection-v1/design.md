# pos-sync-catalog-projection-v1 - Design

## Objective
Define the projection architecture that materializes cloud catalog sync payloads into local SQLite domain tables consumed by POS UI.

## Architecture Flow
Desktop runtime chain:
- IPC controller -> Catalog Sync Use Case -> Projection Repository -> SQLite storage

Cloud sync chain:
- Cloud sync client -> terminal-auth endpoint -> payload -> Catalog Sync Use Case -> Projection Layer

Projection layer responsibilities:
- Validate payload shape and version semantics.
- Execute snapshot and delta projection transactions.
- Return deterministic projection stats and stable errors.

Non-responsibilities:
- No UI rendering.
- No direct SQL in IPC handlers.

## Domain Boundaries
- Cloud remains source of truth for products, taxonomies, games, expansions, prices, and enable flags.
- POS local tables are read-optimized materialized views for offline use.
- POS can create sales, not catalog entities.

## Projection Input Contract
Input entity from cloud sync endpoint:
- entityType
- cloudId
- updatedAt
- versionHash
- payload

Payload must include:
- enabledPOS boolean
- enabledOnlineStore boolean optional
- deletion marker (isDeletedCloud or deletedAt)
- taxonomy and relation references needed by local UI tables

## Projection Algorithms

### Snapshot Apply Semantics
1. Begin transaction.
2. Load current local rows by cloudId and entityType.
3. Soft-disable current projected rows as pre-pass for stale detection.
4. Upsert all incoming snapshot entities by cloudId.
5. For rows not present in snapshot:
   - mark isDeletedCloud=1 or enabledPOS=0
   - do not hard-delete by default
6. Update sync_state with snapshotAppliedAt and snapshotVersion only if version is valid.
7. Commit transaction.

Why soft-disable and no hard-delete:
- Preserves historical sales references to prior products and taxonomies.
- Avoids foreign key breakage in local transactional data.

### Delta Apply Semantics
1. Begin transaction.
2. For each incoming delta entity:
   - upsert by cloudId
   - update flags and payload fields
   - apply delete marker as soft-delete
3. Do not mutate unrelated rows.
4. Update sync_state.lastDeltaSyncAt.
5. snapshotVersion update rule:
   - accept only valid non-regressive versions
   - ignore epoch placeholder values like 1970-01-01T00:00:00.000Z when they would regress local state
   - emit POS_CATALOG_VERSION_INVALID on invalid version input
6. Commit transaction.

### Reconcile or Verify Semantics
1. Read local manifest from projected rows:
   - entityType, cloudId, localId, updatedAt, versionHash
2. Send manifest to cloud reconcile endpoint.
3. Receive plan:
   - missing
   - stale
   - unknown
4. Fetch required updates from cloud.
5. Reuse delta projection path for apply.
6. Persist lastReconcileAt and projection stats.

## SQLite Projection Storage Design
Projection targets are existing domain tables used by POS UI plus metadata columns.
Required additive columns per projected entity table:
- cloudId UNIQUE
- enabledPOS
- enabledOnlineStore
- cloudUpdatedAt
- isDeletedCloud or deletedAt
- versionHash

Support tables:
- catalog_meta for raw sync snapshots and hashes
- catalog_id_map for cloudId to localId
- pos_sync_state for version and timestamps

## UI Filtering Strategy
POS repositories and IPC list endpoints must enforce:
- enabledPOS=true
- not deleted in cloud

POS sell flow must use same filter to prevent selling disabled products.
Historical sales detail uses direct product references and must render even if currently disabled.

## Transaction and Failure Strategy
- Snapshot and delta projection must be atomic.
- On projection failure:
  - rollback transaction
  - keep previous valid projected state
  - set lastSyncErrorCode with stable code
- Reconcile failures do not block POS startup.

## Cloud API Compatibility
- Prefer existing sync endpoints:
  - GET /pos/catalog/snapshot
  - GET /pos/catalog/delta
  - POST /pos/catalog/reconcile
- Any endpoint changes must be additive only.

## Security
- Terminal auth required for sync endpoints.
- Branch scoping must derive from terminal token.
- Renderer never writes SQLite directly.

## Error Mapping
- Projection validation or transaction failures -> POS_CATALOG_PROJECTION_FAILED
- Invalid version transitions -> POS_CATALOG_VERSION_INVALID
- Reconcile transport or payload failures -> POS_CATALOG_RECONCILE_FAILED

## Runtime Sequence Diagrams

Snapshot first run:
- POS startup -> runCatalogSync -> fetch snapshot pages -> projection apply snapshot -> update sync state -> UI repositories read projected rows

Delta steady state:
- POS startup or manual sync -> fetch delta since lastDeltaSyncAt -> projection apply delta -> update sync state -> UI reflects changes

Reconcile flow:
- User clicks reconcile -> build local manifest -> call reconcile endpoint -> fetch missing and stale updates -> apply delta projection -> report stats
