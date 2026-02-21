# Requirements

## Objective
Build an offline-first POS sync engine that replaces the legacy Google Drive sync flow with deterministic catalog and sales synchronization across Electron POS terminals, while preserving terminal activation and token security.

## Scope
- `apps/desktop`: local SQLite sync state, catalog snapshot and delta apply, background sales queue, reconcile action wiring.
- `apps/cloud-api`: POS sync endpoints, idempotency handling, reconcile planner, terminal-auth enforcement.
- `data`: additive-only Prisma changes only if required for idempotency or branch summaries.
- `apps/online-store`: consume-only status visibility if needed. No new admin business logic in this slug.

## Non-Goals
- No checkout or existing online order flow changes.
- No global inventory decrement synchronization across branches.
- No Google Drive sync fallback.
- No media upload redesign.
- No POS role and permission redesign.

## Actors and Roles
- Terminal (device): activated POS client identified by terminal token, terminalId, branchId.
- Branch: inventory authority boundary for local POS edits and local sales.
- Admin (cloud and online-store): monitors sync state and terminal status.
- POS user roles (admin and employee): existing in-app permissions remain unchanged; this slug only enforces sync transport boundaries.

## Functional Requirements

### Catalog Sync (Full + Delta)
- First run performs full catalog snapshot download for the terminal branch scope and selected fulfillment source scope.
- POS persists snapshot metadata keys: `catalogSnapshotVersion`, `snapshotAppliedAt`, `lastDeltaSyncAt`.
- Subsequent runs request delta changes from last known snapshot version or delta cursor.
- Delta sync supports paging and resumable apply.
- Manual Reconcile/Verify action is required.
- Reconcile request sends `catalogManifest[]` entries in this shape:
  - `{ entityType, cloudId, localId, updatedAt, versionHash }`
- Reconcile response returns plan sections:
  - `missing`: cloud entities not present locally.
  - `stale`: local entities older than cloud.
  - `unknown`: local mappings with no cloud entity (mark as orphan, do not delete automatically without explicit rule).
- POS applies reconcile plan safely and transactionally.

### Sales Sync (Background + Queue)
- On local sale commit, POS atomically writes sale records and enqueues a `SYNC_EVENT` in `sync_journal`.
- POS immediately attempts background send after enqueue.
- If network fails or endpoint fails with retriable code, event remains queued for retry.
- Retries survive app restart.
- Sync is idempotent with required idempotency key fields:
  - `terminalId`
  - `posId` (or `deviceId`)
  - `localEventId` (UUID)
- Cloud enforces uniqueness using at least `(terminalId, localEventId)`.

### Multi-terminal Behavior
- Multiple ACTIVE terminals can create sales concurrently in the same branch.
- Inventory edits remain local branch-terminal operations.
- Cloud receives append-only sales and branch summaries for reporting and backup.

### Branch vs Online-store Inventory Selection
- POS supports fulfillment source selection for pickup sales:
  - Branch inventory
  - Online-store inventory as digital branch source
- Sync engine must preserve catalog parity metadata for both sources.

### Offline Behavior
- POS reads catalog from local SQLite when offline.
- POS can create sales, cash register sessions, and tournaments while offline according to existing role permissions.
- Offline mode never forces terminal re-activation unless terminal auth is explicitly revoked or invalidated by stable terminal auth codes.

## Data Model

### Local SQLite (minimum required logical tables)
- `catalog_meta`
- `catalog_entities` (or typed `catalog_entities_*` tables)
- `catalog_id_map` (cloudId to localId)
- `sync_journal`
- `sync_state`
- existing sales tables (`sales`, `sale_items`, cash register tables) remain authoritative locally.

### Cloud Postgres and Prisma
- Prefer additive minimal tables only when required:
  - `PosSyncEvent` for idempotency ledger and dedupe status.
  - `BranchInventorySummary` optional for reporting snapshots.
- If Prisma schema changes are required:
  - additive only
  - no removals or renames
  - indexed by terminalId, branchId, idempotency key fields.

## Sync Semantics and Idempotency
- Delivery model: at-least-once from POS to cloud.
- Effect model: exactly-once logical effect via idempotency ledger.
- POS retry policy:
  - exponential backoff with upper cap.
  - bounded retry count before `manual_intervention_required` state.
- POS transaction rule:
  - sale write + sync_journal enqueue in one local DB transaction.
- Cloud transaction rule:
  - dedupe check + event persist + sale ingestion in one DB transaction.

## Conflict Rules
- Catalog source of truth is cloud.
- Local inventory source of truth is branch POS terminals.
- Cloud inventory summaries are non-authoritative mirrors.
- Sales are append-only after sync ingestion.
- Refund mutation rules are out of scope and handled by existing refund domain.

## Security
- Terminal auth token is required for all POS sync endpoints.
- Reconcile endpoint must enforce branch scoping and must not leak entities from other branches.
- Request payload schema validation is required for snapshot, delta, reconcile, and sales sync endpoints.
- Payload size limits are required for manifest and batch sync submissions.
- Rate limiting is required for sync endpoints or must be explicitly enforced by infrastructure middleware.
- No client-side secrets.
- No public object storage write path for sync artifacts.

## Performance Constraints
- Full snapshot payload must support batching.
- Delta sync must be paged and resumable.
- Reconcile manifest max items per request must be bounded with batching strategy.
- Sales queue worker must support bounded parallelism and backpressure.
- API handlers must avoid N+1 access patterns.

## Error Model (Stable Codes)
- `POS_SYNC_UNAUTHORIZED`
- `POS_SYNC_RATE_LIMITED`
- `POS_CATALOG_SNAPSHOT_FAILED`
- `POS_CATALOG_DELTA_FAILED`
- `POS_CATALOG_RECONCILE_FAILED`
- `POS_CATALOG_MANIFEST_TOO_LARGE`
- `POS_SYNC_EVENT_INVALID`
- `POS_SYNC_EVENT_DUPLICATE`
- `POS_SYNC_STORAGE_FAILED`
- Existing terminal auth stable codes remain valid and must be reused where applicable.

## Observability (Logs and Metrics)
- Required log fields:
  - `terminalId`
  - `branchId`
  - `eventId`
  - `syncAttempt`
  - `errorCode`
- Required counters and gauges:
  - `queued_events`
  - `synced_events`
  - `reconcile_runs`
  - `delta_sync_runs`
  - retry backlog depth and oldest pending event age.

## Acceptance Criteria
1. First run downloads full snapshot, persists locally, and POS boots offline with catalog data.
2. Delta sync applies cloud updates without full wipe.
3. Reconcile action returns a plan and POS applies missing and stale updates while flagging unknown entries.
4. Offline sale commit enqueues event and later syncs exactly once when online.
5. Two active terminals in the same branch can sync concurrent sales without duplicate ingestion.
6. No global inventory decrement synchronization exists in the sync path.
7. Rate-limit behavior is documented and enforced at endpoint or infrastructure layer.
8. Build commands pass for touched modules and spec audit runs clean.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-offline-sync-engine-v1"`
