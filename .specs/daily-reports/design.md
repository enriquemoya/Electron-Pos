# Design: Daily Reports (Daily Reports)

## Data Aggregation Concepts
- Aggregate sales by date (created_at).
- Calculate sums by payment method.
- Count number of sales for the day.

## Payment Method Breakdown
- Total by method:
  - Cash
  - Transfer
  - Card
  - Store Credit

## Credit Aggregation
- Credit granted today = sum of positive movements in store_credit_movements.
- Credit used today = sum of negative movements related to sales of the day.

## Proof Status Aggregation
- Count sales with proof_status = PENDING for the selected date.

## Shift Aggregation
- List shifts for the day with:
  - opened_at
  - closed_at
  - opening_amount
  - expected_amount
  - real_amount
  - difference

## UI Flows
- Date selection.
- Summary view (cards/table with totals).
- Detail view:
  - Sales for the day.
  - Shifts for the day.

## Responsibilities
- Domain (packages/core):
  - Helper types if needed for the report.
- DB (packages/db):
  - Aggregated queries by date.
- IPC (apps/desktop):
  - Expose daily report methods.
- UI (apps/web):
  - Date, summary, detail.

## IPC Usage
- Renderer only calls window.api.*
- No direct SQLite access.

## Error Handling
- Inline messages when queries fail.
- Invalid date handling.

## Persistence Strategy
- SQLite stores sales, credit movements, and shifts.
- Drive does not participate in reports.

## Future Extensions
- Export to Excel.
- Historical charts.
- Reports by user.
