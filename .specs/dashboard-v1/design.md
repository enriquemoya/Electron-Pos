# Dashboard v1 - Design

## Layout Structure
- Top header with title and current date.
- Four sections in vertical flow:
  1) Daily Status (cards).
  2) Sales Summary (cards + breakdown list).
  3) Operational Alerts (lists).
  4) Recent Activity (compact feed).

## Data Sources and Aggregations

### Daily Status
- Date: operator local time via `new Date()` formatting.
- Cash register status:
  - Active shift from shifts table.
  - If open: openedAt displayed.
- Total sales today:
  - SUM(sales.total_amount) for local day.
- Number of sales today:
  - COUNT(*) for local day.

### Sales Summary
- Total amount sold today: same as Daily Status.
- Payment breakdown:
  - SUM by payment_method for local day.
- Average ticket:
  - total amount / count (guard against divide by zero).

### Operational Alerts
- Out of stock: inventory alerts type OUT_OF_STOCK, ACTIVE, limit 5.
- Low stock: inventory alerts type LOW_STOCK, ACTIVE, limit 5.
- Pending proofs: sales where proof_status = PENDING, limit 5.
- Tournaments without winners:
  - Tournaments CLOSED with no prizes recorded, limit 5.

### Recent Activity
- Recent sales, customers, and tournaments combined into a unified feed.
- The feed shows the last 5 items TOTAL across all sources (no heavy join).

## IPC Responsibilities
- Expose dashboard endpoints returning pre-aggregated data:
  - getDailyStatus(date)
  - getSalesSummary(date)
  - getOperationalAlerts()
  - getRecentActivity()
- IPC returns minimal DTOs (strings, counts, ids).

### IPC Response Hints (high-level keys)
- Daily status: { date, shiftStatus, openedAt?, salesTotal, salesCount }
- Sales summary: { total, byMethod, averageTicket }
- Operational alerts: { outOfStock[], lowStock[], pendingProofs[], tournamentsWithoutWinners[] }
- Recent activity: { items[] }

## DB Responsibilities
- Provide aggregated queries with local day ranges:
  - Use local day start/end converted to ISO for queries.
- No heavy joins; use simple aggregates and indexes.

## UI Responsibilities
- Render Shadcn Cards and Lists.
- Display link actions for alert items:
  - Products for stock alerts.
  - Sales for pending proofs.
  - Tournaments for missing winners.
- No CRUD actions in dashboard.

## Error and Empty States
- Empty data should show "Sin datos hoy" or similar.
- If a section fails, show inline error and keep rest visible.

## Navigation Behavior
- Alert items navigate to their module:
  - Stock alerts -> /inventory
  - Pending proofs -> /sales
  - Tournaments missing winners -> /tournaments

## Timezone Handling
- Business day uses operator local time.
- Local start/end converted to ISO for queries.
- Display dates in local time without fixed timezone.

## Components (Shadcn)
- Card, Button, Badge, Separator, Table (if needed), ScrollArea.

## Route
- /dashboard
