# Runtime Evidence - Reconcile Drift Repair

- Date/time (UTC): 2026-02-20T05:11:31Z
- appEnv: prod
- branchId: c3df9d36-30a4-4ca5-8c5e-6f0a162053f4
- terminalId: cmlt38rvi000312mbawgmt2ve

## Drift Approach
- Planned: induce drift and run reconcile through POS IPC/UI.
- Runtime limitation in this environment: no interactive Electron display capture and no direct IPC execution channel from this CLI session.

## Steps Executed
1. Verified local reconcile timestamp in SQLite (`last_reconcile_at`).
2. Verified local projection and mapping tables exist.
3. Collected cloud vs local metadata snapshot for mismatch analysis.

## Expected vs Observed

### A) Reconcile reports missing/outdated by entityType
- Expected: reconcile response with per-entity missing/outdated counts.
- Observed: direct reconcile invocation was not executed in this run due runtime constraints.
- Result: NOT VERIFIED.

### B) Reconcile repairs drift and aligns picker/product labels
- Expected: post-reconcile local values align with cloud values.
- Observed: cannot assert without reconcile execution + UI/DB before/after pair.
- Result: NOT VERIFIED.

### C) Legacy rows are preserved (non-destructive)
- Expected: reconcile does not hard-delete legacy rows.
- Observed: local product sample still resolves legacy category label (`legacy:category:commodity` -> `COMMODITY`).
- Result: PARTIAL.

## Logs Snippet (redacted)
- `pos_sync_state.last_reconcile_at`: `2026-02-20T02:30:10.383Z`
- local join sample confirms non-destructive label resolution for existing product row.

## Screenshots Referenced
- `/Users/enriquemoya/Documents/GitHub/Electron-Pos/artifacts/pos-sync/pos-sync-taxonomy-parity-v1/runtime/screens/README.md`
