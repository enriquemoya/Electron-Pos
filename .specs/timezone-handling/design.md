# Timezone Handling - Design

## Timezone Baseline
- Business timezone is the operator's local machine timezone (dynamic).
- SQLite stores timestamps as ISO strings.

## Local Day Range Helper
- Input: `YYYY-MM-DD` (local date string).
- Output: `startISO` and `endISO` created from local midnight boundaries.
- Convert to ISO only after constructing local start/end.

## Rules
- Never use `new Date("YYYY-MM-DD")` for business-day logic (UTC parsing risk).
- Default "today" uses local date (`toLocaleDateString("en-CA")`).
- All UI rendering uses `Intl.DateTimeFormat` with explicit local timezone handling (no fixed TZ).
- Drive proof folders use local business-day date, not UTC.

## Conversion Rules
- Local operator time -> ISO (UTC) for storage.
- ISO (UTC) -> local operator time for display.

## Affected Areas
- Daily reports queries.
- Sales history filters.
- Shift day boundaries.
- Proof folder names.

## Error Handling
- Inline errors only; no alerts.
- If date parsing fails, show a clear localized error.

## Persistence Strategy
- Keep ISO strings in DB; do not change schema.
- Query by ISO range derived from local day range.

## Future Extensions
- Configurable timezone in settings.
- Multi-store timezone support.
