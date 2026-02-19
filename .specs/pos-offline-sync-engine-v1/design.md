# Design

## Objective
Define an offline-first sync architecture that replaces Google Drive sync with resilient snapshot, delta, reconcile, and sales event synchronization using terminal-authenticated APIs.

## Scope
- Desktop POS sync engine and local SQLite persistence.
- Cloud API sync contracts and ingestion use cases.
- Optional additive Prisma entities only for idempotency and summaries.

## Non-Goals
- No POS UI redesign except reconcile trigger and status surfaces.
- No global inventory merge algorithm.
- No replacement of terminal activation or token rotation protocol.

## Controller -> Use Case -> Repository -> Storage
- Controller:
  - Parses and validates request payloads.
  - Enforces terminal auth context from middleware.
  - Delegates orchestration to use cases.
- Use Case:
  - Applies sync rules, idempotency checks, conflict policies, and retry semantics.
  - Builds reconcile plans.
- Repository:
  - Encapsulates data reads and writes for Prisma and SQLite adapters.
  - No business decisions.
- Storage:
  - Prisma storage for cloud persistence.
  - SQLite storage for POS local data, journal, and state.

## Architecture Components
- POS Sync Engine (desktop):
  - SnapshotPullService
  - DeltaPullService
  - ReconcileService
  - SalesQueueWorker
  - SyncJournalRepository (SQLite)
- Cloud API:
  - SyncController
  - CatalogSyncUseCase
  - SalesIngestionUseCase
  - ReconcilePlannerUseCase
  - PosSyncEventRepository (Prisma)

## API Contract Additions (Additive)
- `GET /pos/catalog/snapshot`
- `GET /pos/catalog/delta`
- `POST /pos/catalog/reconcile`
- `POST /pos/sync/sales-events`
- Optional health endpoint for worker diagnostics.

## Local Persistence Strategy
- `sync_state` tracks snapshot and delta cursors.
- `sync_journal` stores queued events with status, retry count, next retry timestamp, and last error code.
- `catalog_id_map` maintains cloudId to localId identity mapping.

## Cloud Persistence Strategy
- `PosSyncEvent` ledger stores idempotency keys and ingestion status.
- Optional `BranchInventorySummary` stores periodic branch-level summaries only.

## Sequence Diagram: First Snapshot
- POS startup
  -> check `catalog_meta`
  -> if missing snapshot, call `GET /pos/catalog/snapshot`
  -> validate payload and write snapshot in SQLite transaction
  -> update `sync_state.catalogSnapshotVersion` and `snapshotAppliedAt`
  -> unlock normal POS operations

## Sequence Diagram: Delta Sync
- Scheduler tick or startup
  -> read `sync_state.catalogSnapshotVersion` and `lastDeltaSyncAt`
  -> call `GET /pos/catalog/delta?sinceVersion=...`
  -> apply changed entities batch by batch
  -> update `sync_state.catalogSnapshotVersion` and `lastDeltaSyncAt`

## Sequence Diagram: Reconcile Verify
- User presses Reconcile button
  -> POS builds `catalogManifest` from local mappings
  -> `POST /pos/catalog/reconcile`
  -> cloud computes `missing`, `stale`, `unknown`
  -> POS applies missing and stale updates
  -> POS flags unknown entities as orphaned and logs summary

## Sequence Diagram: Sale Enqueue and Background Sync
- Sale finalized offline or online
  -> local transaction: write sale rows + enqueue `sync_journal` event
  -> background worker attempts send `POST /pos/sync/sales-events`
  -> cloud dedupes by `(terminalId, localEventId)`
  -> on success mark event synced
  -> on retriable failure update retry schedule with exponential backoff
  -> on max retries mark `manual_intervention_required`

## Conflict Handling
- Catalog conflict: cloud version overwrites local stale entity.
- Unknown local mapping: keep local row flagged orphan until manual review.
- Sales duplicate: cloud returns `POS_SYNC_EVENT_DUPLICATE`, POS marks event synced as idempotent no-op.

## Security Design
- Terminal-auth middleware wraps every POS sync endpoint.
- Branch scoping enforced in use cases for snapshot, delta, and reconcile.
- Payload caps for manifest and event batches.
- Rate-limit middleware on sync endpoints.

## Performance Design
- Snapshot and delta responses use paging and compression-friendly JSON shapes.
- Reconcile accepts batched manifests with server-side limits.
- Worker uses bounded concurrency and jittered exponential backoff.

## Error Handling
- Controller maps domain and repository exceptions to stable codes.
- Worker persists last error code and retry metadata in `sync_journal`.
- Terminal auth failures short-circuit sync attempts and keep deterministic state.

## Validation Strategy
- Contract tests for stable error codes.
- Integration tests for idempotent sales ingestion and duplicate no-op behavior.
- Local smoke scripts for offline queue and reconnect flush behavior.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-offline-sync-engine-v1"`
