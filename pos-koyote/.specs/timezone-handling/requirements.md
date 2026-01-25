# SPEC: Timezone Handling

## Goal
Ensure all dates, times, and "daily" boundaries match the operator's local timezone (machine/OS timezone) while keeping ISO timestamps in SQLite.

## Users
- Cashiers reviewing sales and shifts for a specific day.
- Managers generating daily reports.

## Language & i18n (MANDATORY)
- All visible UI text must be in Spanish (MX).
- No hardcoded strings in JSX; use dictionary keys.

## Core Capabilities
- Local business-day boundaries are calculated in the operator's local time.
- UI renders date/time using the operator's local timezone.
- Drive proof folders use local business-day date.

## Constraints
- Keep ISO strings in SQLite (no schema change).
- Convert to ISO only after creating local start/end boundaries.
- Renderer never uses DB directly; all queries via IPC.

## Out of Scope
- Timezone configuration UI.
- Multi-store timezone support.
- Custom fixed timezone overrides.

## Performance Expectations
- Date filtering remains fast (index-friendly queries).
- UI formatting is client-side and lightweight.

## Notes
- If the store location or operator changes timezone, the system follows the machine's timezone automatically.
