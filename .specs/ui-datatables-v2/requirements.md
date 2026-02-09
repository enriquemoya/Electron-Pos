# UI DataTables v2 — Requirements

## Goals
- Modernize Customers, Inventory, and Sales History UI with Shadcn UI and server-side DataTables.
- Ensure pagination and filtering are IPC-driven and local-first.

## Users
- Store owner
- Store staff

## UX objectives
- Fast, consistent list views.
- Predictable filters with server-side pagination.
- Modal-based create/edit for customers only.

## Global rules
- Shadcn UI components only (DataTable, Dialog, Input, Select, Button).
- No hardcoded strings; Spanish (MX), i18n-ready.
- Renderer does not access SQLite directly; all data via IPC.
- SQLite is the source of truth.

## Customers
- List view:
  - DataTable with pagination (IPC).
  - Filters: name, phone, email.
  - Default: latest created.
  - Row actions: Edit, View detail.
- Create/Edit:
  - Modal (Dialog).
  - Fields: names, father last name, mother last name, phone, email.
  - At least one of phone or email required.
  - Phone and email must be unique.
- Credit view remains on its own route (no change).

## Inventory
- List view:
  - DataTable with pagination.
  - Filters: product name, game type, stock status (Normal, Low, Out).
  - Default: latest updated or added.
- Stock states:
  - Normal, Low stock, Out of stock with distinct visual styles.

## Sales History
- List view:
  - DataTable with pagination.
  - Filters: date range, payment method, customer.
  - Default: latest sales.
- Detail:
  - Row click navigates to a separate route (no modal).

## Constraints
- No feature changes beyond UI/UX and pagination/filtering.
- Keep existing business rules intact.

## Out of scope
- New business logic.
- New data models beyond query/filters.

## Performance expectations
- Fast lists for hundreds of rows.
- Queries should be paginated and indexed where needed.
