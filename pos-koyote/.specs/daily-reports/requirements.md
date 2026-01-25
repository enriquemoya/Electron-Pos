# SPEC: Daily Reports (Daily Reports)

## Goal
Allow management and staff to consult a daily summary of sales and cash register activity to close the day with reliable data.

## Users
- Management
- Shift supervisor
- Cashiers with report access

## Language & i18n (MANDATORY)
- All visible UI text must be in Spanish (MX).
- No hardcoded strings in JSX; use dictionary.
- Examples: "Reporte diario", "Total de ventas", "Ventas del dia".

## Core Capabilities
- Select a date.
- View daily summary:
  - Total sold.
  - Number of sales.
  - Totals by payment method (Cash, Transfer, Card, Store Credit).
- Credit summary:
  - Credit granted today.
  - Credit used today.
- Proof summary:
  - Count of pending proofs.
- Cash register summary:
  - Shifts opened and closed.
  - Expected vs real per shift.
  - Differences.
- View details:
  - List of sales for the day.
  - List of shifts for the day.

## Constraints
- SQLite is the source of truth.
- Persistence only via IPC.
- Renderer does not access DB.
- Google Drive is a mirror, not authority.

## Out of Scope
- Monthly or yearly reports.
- Accounting exports.
- Manual report adjustments.
- Multi-store.

## Performance Expectations
- Daily summary must respond quickly locally.
- Single-day queries should load in < 1s for typical volumes.
