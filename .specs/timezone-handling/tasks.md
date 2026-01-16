# Timezone Handling - Tasks

## Phase 1: Helpers
- Define local day range helper for `YYYY-MM-DD`.
- Use the operator's local machine timezone (no fixed TZ constant).

## Phase 2: Persistence Queries
- Update daily queries to use local day range ISO boundaries.
- Avoid direct `new Date("YYYY-MM-DD")` conversions.

## Phase 3: IPC
- Ensure date filters are passed as local day strings.
- Convert to ISO range in main process before querying.

## Phase 4: UI
- Render all timestamps using the operator's local timezone.
- Default date selectors to local date (not UTC).
- Ensure proof folder date uses local day.

## Phase 5: Validation
- Verify day-boundary accuracy around midnight.
- Validate daily report totals match cash register expectations.
