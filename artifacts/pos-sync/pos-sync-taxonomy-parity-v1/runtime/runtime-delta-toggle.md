# Runtime Evidence - Delta Toggle Enable/Disable

- Date/time (UTC): 2026-02-20T05:11:31Z
- appEnv: prod
- branchId: c3df9d36-30a4-4ca5-8c5e-6f0a162053f4
- terminalId: cmlt38rvi000312mbawgmt2ve

## Steps Executed
1. Validated local category distribution in SQLite.
2. Checked local sync state after recent delta sync.
3. Attempted to produce before/after visual evidence.

## Expected vs Observed

### A) Disabled category disappears from selection picker
- Expected: at least one category toggled `enabledPOS=false` in cloud then removed from picker after delta.
- Observed:
  - Local categories distribution: total=1, enabled_pos_true=1, enabled_pos_false=0.
  - No disabled category currently available in local dataset for before/after comparison.
- Result: BLOCKED by dataset precondition.

### B) Historical references remain resolvable
- Expected: previous records still resolve labels.
- Observed: current join sample resolves product -> category label correctly.
- Result: PARTIAL (no delta toggle scenario executed in this run).

### C) Sellability follows enabledPOS and deleted rules
- Expected: disabled/deleted entities non-selectable.
- Observed: repository filters enforce enabled/deleted constraints; runtime toggle evidence not captured due missing disabled sample.
- Result: PARTIAL.

## Logs Snippet (redacted)
- `categories_distribution`: `{total:1, enabled_pos_true:1, enabled_pos_false:0, deleted_true:0}`
- `pos_sync_state.last_delta_sync_at`: `2026-02-20T05:10:03.381Z`

## Screenshots Referenced
- `/Users/enriquemoya/Documents/GitHub/Electron-Pos/artifacts/pos-sync/pos-sync-taxonomy-parity-v1/runtime/screens/README.md`
