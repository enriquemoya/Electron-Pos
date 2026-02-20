# pos-sync-catalog-projection-v1 - Requirements

## Objective
Implement the missing bridge from cloud catalog sync payloads to local SQLite domain tables used by POS UI. Ensure products, taxonomies, games, expansions, and prices downloaded from cloud become visible and sellable in POS according to cloud flags and deletion state.

## Scope
- apps/desktop:
  - SQLite schema additions for cloud identity and projection metadata.
  - Projection layer that materializes snapshot and delta payloads into POS domain tables.
  - Sync engine integration for snapshot, delta, and manual reconcile.
  - IPC and repository query filtering to respect enabledPOS and cloud deletion markers.
- apps/cloud-api:
  - Consume existing terminal-auth sync endpoints.
  - Additive endpoint changes only if required for reconcile correctness.
- apps/online-store:
  - Consume-only.
  - No redesign.

## Non-Goals
- No POS catalog authoring. POS cannot create or edit catalog entities.
- No checkout redesign.
- No new pricing engine.
- No breaking API contract changes.
- No hard delete of local catalog rows by default.

## Actors and Roles
- Terminal:
  - Pulls catalog snapshot and delta through terminal-auth endpoints.
  - Projects cloud entities to local domain tables.
- Admin:
  - Manages cloud catalog source data and enable flags.
  - Can trigger manual reconcile from POS UI for integrity checks.

## Functional Requirements
- Snapshot first run:
  - POS downloads full catalog snapshot from cloud.
  - POS projects snapshot into local domain tables in a single transaction.
- Delta after snapshot:
  - POS downloads versioned delta updates.
  - POS applies upserts, flag changes, and cloud deletions by cloudId.
- Manual Reconcile or Verify:
  - POS sends local manifest grouped by entityType with cloudId, localId, updatedAt, versionHash.
  - Cloud returns missing and stale entities.
  - POS fetches needed updates and reprojects safely.
- Projection rules:
  - Cloud is source of truth for catalog entities and prices.
  - enabledPOS controls POS visibility and sellability.
  - enabledOnlineStore may be stored locally for consistency and audits but does not drive POS sellability.
  - isDeletedCloud or deletedAt marks cloud-deleted entities; these must not be sellable.
- UI consumption rules:
  - POS listing and sales selection include only enabledPOS=true and not deleted.
  - Historical sales references remain resolvable even when items are disabled later.
- Delta version safety:
  - Delta sync must never overwrite a valid local snapshotVersion with epoch or invalid versions.

## Data Model
Local SQLite model extensions must be additive and include per entity table or shared projection tables:
- cloudId TEXT UNIQUE NOT NULL
- enabledPOS INTEGER NOT NULL DEFAULT 1
- enabledOnlineStore INTEGER NOT NULL DEFAULT 0
- cloudUpdatedAt TEXT NULL
- isDeletedCloud INTEGER NOT NULL DEFAULT 0 or deletedAt TEXT NULL
- versionHash TEXT NULL

Local sync state:
- snapshotVersion TEXT NULL
- snapshotAppliedAt TEXT NULL
- lastDeltaSyncAt TEXT NULL
- lastReconcileAt TEXT NULL
- lastSyncErrorCode TEXT NULL

## Security
- Terminal-auth is required for snapshot, delta, and reconcile endpoints.
- No client-side secrets in renderer; token stays in terminal auth secure storage.
- Projection writes are IPC-only; renderer never accesses SQLite directly.
- Branch scope from terminal token must be preserved in all sync calls.

## Architecture
- apps/desktop explicit chain:
  - Controller or IPC handler -> Use Case -> Repository -> Storage (SQLite)
- Projection layer is a separate module:
  - Input: cloud catalog entities from snapshot or delta
  - Output: transactionally materialized rows in POS domain tables + sync state updates
- Sync engine orchestrates download and projection but does not contain table-level SQL details.

## Error Model
Stable codes required:
- POS_CATALOG_SNAPSHOT_FAILED
- POS_CATALOG_DELTA_FAILED
- POS_CATALOG_RECONCILE_FAILED
- POS_CATALOG_MANIFEST_TOO_LARGE
- POS_CATALOG_PROJECTION_FAILED
- POS_CATALOG_VERSION_INVALID
- POS_SYNC_STORAGE_FAILED

Rules:
- No ad-hoc string-only errors in sync and projection paths.
- Invalid or epoch-like version regressions must map to POS_CATALOG_VERSION_INVALID and keep last valid local version.

## Observability
Structured logs for sync and projection operations must include:
- terminalId
- branchId
- operation (snapshot, delta, reconcile, projection)
- itemCounts (received, inserted, updated, disabled, deleted)
- snapshotVersionBefore and snapshotVersionAfter
- errorCode on failures

Metrics counters:
- catalog_snapshot_runs
- catalog_delta_runs
- catalog_reconcile_runs
- catalog_projection_inserts
- catalog_projection_updates
- catalog_projection_disables
- catalog_projection_deletes

## Acceptance Criteria
- Snapshot populates local POS domain tables and products appear in POS UI.
- Delta updates toggle enabledPOS and UI visibility without breaking historical sales lookup.
- Reconcile fixes missing or stale entities by cloudId.
- Delta cannot reset local version to epoch when no changes are returned.
- POS sell flow excludes deleted and enabledPOS=false entities.
- Build gates pass:
  - npm run build -w apps/desktop
  - npm run build -w apps/cloud-api
  - npm run build -w apps/online-store

## Spec Audit Command
npm run gov:spec:audit -- "pos-sync-catalog-projection-v1"
