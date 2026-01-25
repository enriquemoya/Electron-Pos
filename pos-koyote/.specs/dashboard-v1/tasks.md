# Dashboard v1 - Tasks

## Phase 1 - DB Aggregations
- Add queries for:
  - Sales count and total for local day.
  - Payment method breakdown for local day.
  - Pending proof sales (limit 5).
  - Low stock and out of stock alerts (limit 5 each).
  - Tournaments closed without winners (limit 5).
  - Recent activity feed (last 5 total across sales, customers, tournaments).

## Phase 2 - IPC Endpoints
- Add IPC endpoints returning:
  - Daily status summary.
  - Sales summary.
  - Operational alerts.
  - Recent activity feed.

## Phase 3 - Dashboard UI
- Route: /dashboard.
- Shadcn cards for Daily Status and Sales Summary.
- List sections for Alerts and Recent Activity.
- Inline empty and loading states.

## Phase 4 - Alert Linking
- Links from alert items to:
  - /inventory
  - /sales
  - /tournaments

## Phase 5 - Validation and UX Polish
- Ensure local day boundaries are correct.
- Loading and error states per section.
- Ensure all UI strings are Spanish (MX) and i18n-ready.
