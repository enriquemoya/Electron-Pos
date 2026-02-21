# Tasks

## Objective
Deliver a production-grade offline sync engine that replaces legacy Google Drive sync and provides deterministic catalog and sales synchronization.

## Scope
- `apps/desktop`
- `apps/cloud-api`
- optional additive Prisma changes only when required for idempotency.

## Non-Goals
- No checkout redesign.
- No online-store admin feature expansion except optional consume-only status views.
- No global inventory synchronization model.

## Functional Requirements
- Implement full snapshot then delta sync.
- Implement manual reconcile verify flow.
- Implement atomic sale enqueue and background retry sync.
- Preserve branch and terminal boundaries.

## Data Model
- Add local SQLite sync tables and indexes.
- Add cloud idempotency table only if required.
- Keep Prisma changes additive.

## Sync Semantics and Idempotency
- At-least-once delivery with exactly-once effect.
- Idempotency key includes terminalId, posId, localEventId.
- Retry with exponential backoff, capped attempts, manual intervention state.

## Conflict Rules
- Cloud owns catalog truth.
- Branch POS owns local inventory edits.
- Sales are append-only after ingestion.

## Security
- Terminal auth on all POS sync endpoints.
- Branch-scoped reconcile responses.
- Payload size and schema validation.
- Rate limiting required.

## Performance Constraints
- Snapshot and delta batching.
- Manifest size limit and batching.
- Worker bounded concurrency.

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

## Observability (Logs and Metrics)
- Logs must include terminalId, branchId, eventId, syncAttempt, errorCode.
- Metrics include queued_events, synced_events, reconcile_runs, delta_sync_runs.

## Acceptance Criteria
1. Full snapshot on first run, then offline catalog availability.
2. Delta sync updates local catalog incrementally.
3. Reconcile returns actionable plan and is applied safely.
4. Offline sales queue flushes online without duplicates.
5. Concurrent sales from multiple active branch terminals dedupe correctly.
6. No global inventory decrement synchronization in sync engine.
7. Rate limiting documented and enforced.
8. Build and governance checks pass.

## Phase 1: Legacy Sync Replacement
- Identify and remove Google Drive sync coupling from POS bootstrap and sync paths.
- Introduce isolated sync engine interfaces.
- Deliverable: no runtime dependency on Google Drive for catalog or sales sync.

## Phase 2: Local SQLite Schema and State
- Add local tables: catalog_meta, catalog_entities, catalog_id_map, sync_journal, sync_state.
- Define migration strategy for existing local DBs.
- Deliverable: deterministic local sync metadata and queue persistence.

## Phase 3: Cloud Endpoints and Idempotency
- Add snapshot, delta, reconcile, and sales-events endpoints.
- Add idempotency ledger persistence and indexes.
- Deliverable: stable API contracts and dedupe behavior.

## Phase 4: POS Sync Engine Worker
- Implement snapshot pull, delta pull, reconcile apply, and sales queue worker.
- Implement retry and backoff rules.
- Deliverable: background sync resilient to restarts and offline periods.

## Phase 5: Reconcile UX and Observability
- Add manual Reconcile/Verify trigger and status feedback.
- Add structured logs and counters.
- Deliverable: operator visibility into sync health and drift.

## Phase 6: Validation and Runtime Checks
- Add runtime scripts and curl checks for snapshot, delta, reconcile, and idempotent sales sync.
- Validate multi-terminal concurrency scenario.
- Deliverable: reproducible validation checklist and evidence.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-offline-sync-engine-v1"`
