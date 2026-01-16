# Dashboard v1 - Requirements

## Goal
Provide a read-only, operational view of today so the operator can understand the store status in under 10 seconds.

## Users
- Store owner
- POS staff

## UX Principles
- Read-only and action-oriented.
- Fast to scan.
- Minimal distractions; no charts in v1.

## Sections and Data Shown

### Section 1 - Daily Status (cards)
- Current date (operator local time).
- Cash Register status:
  - Open or Closed.
  - Opened at (if open).
- Total sales today.
- Number of sales today.

### Section 2 - Sales Summary
- Total amount sold today.
- Payment method breakdown:
  - Cash
  - Transfer
  - Card
  - Store credit
- Average ticket today.

### Section 3 - Operational Alerts (lists, max 5 each)
- Products out of stock.
- Products with low stock.
- Sales pending payment proof.
- Tournaments without winners assigned (status = CLOSED and zero prizes assigned).
- Each item shows minimal context and links to its module.

### Section 4 - Recent Activity (last 5 total)
- Shows the last 5 items TOTAL across sales, customers, and tournaments (combined feed).

## Language and i18n
- All UI text in Spanish (MX).
- No hardcoded strings; dictionary-based text.

## Constraints
- Local-first; SQLite is source of truth.
- IPC-only persistence and data access.
- Use aggregated queries (COUNT/SUM) only.
- No historical ranges beyond "today".

## Route
- /dashboard

## Out of Scope
- Full reporting.
- CRUD or configuration.
- Charts or graphs.
- Exporting.

## Performance
- Initial load under 1 second for 1,000 records.
- Dashboard refresh under 500 ms with cached data.
