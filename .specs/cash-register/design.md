# Design: Cash Register (Cash Register / Closeout)

## Core Concepts
- Shift:
  - id, openedAt, closedAt (nullable)
  - openedBy (optional)
  - initialCash (Money)
  - expectedCash (Money)
  - countedCash (Money, nullable)
  - difference (Money, nullable)
  - totals (sales, cash, etc.)
  - status: OPEN | CLOSED

## Rules
- Only one active shift (OPEN) at a time.
- CLOSED shift is immutable.
- New sales must point to the active shift.
- If there is no active shift, confirming a sale is not allowed.

## High-Level Flow
1) Open cash register -> record opening cash.
2) Operate shift -> accumulated sales increment expected.
3) Close cash register -> capture counted cash.
4) Calculate difference and store closeout.

## UI Routes
- /cash-register (or /settings/caja if pattern already exists)
  - Current state (open/closed)
  - "Abrir caja" button
  - Shift summary (totals)
  - "Cerrar caja" button
- History: list view of closed shifts (read-only)

## Responsibilities
- Domain (packages/core):
  - Shift and Money models
  - Expected and difference calculations
  - State validations (OPEN/CLOSED)
- DB (packages/db):
  - shifts table and relation to sales
  - Repositories to create/read/close shifts
- IPC (apps/desktop):
  - Methods: getActiveShift, openShift, closeShift, listShifts
- UI (apps/web):
  - Forms and visual state
  - i18n for strings
  - No persistence logic

## Error Handling
- Block open if there is already an active shift.
- Block close if there is no active shift.
- Validate amounts (no negatives).
- Inline messages, no alert().

## Persistence Strategy
- SQLite as source of truth.
- Sales store shift_id.
- Shift close stores countedCash and difference.

## Future Extensions
- Multiple registers per store.
- Reports by day/user.
- Closeout printing.
