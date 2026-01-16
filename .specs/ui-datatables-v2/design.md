# UI DataTables v2 — Design

## Data models involved
- Customers, Inventory, Products, Sales, Game Types.
- No new core models; use existing repositories and IPC contracts.

## Pagination + filtering flow
- UI sends filters + paging (page, pageSize, sort) via IPC.
- IPC queries DB with LIMIT/OFFSET and returns:
  - items
  - total
  - page
  - pageSize
- UI renders DataTable rows and pagination controls.

## Customers UI
- List route: /customers
- Filters: name, phone, email.
- Default sort: created_at DESC.
- Actions:
  - Edit in modal.
  - View detail in route.
- Modal:
  - Validates phone/email uniqueness and required contact rule.
  - Inline errors (Spanish, i18n).

## Inventory UI
- List route: /inventory
- Filters: product name, game type, stock status.
- Default sort: updated_at DESC (or created_at if updated_at not present).
- Stock status styling in table rows.

## Sales History UI
- List route: /sales
- Filters: date range, payment method, customer.
- Default sort: created_at DESC.
- Detail route: /sales/[id] (or export-safe alternative if required by build config).

## Modal behavior
- Only Customers create/edit uses Dialogs.
- Forms must reset on close and re-open with clean state.

## IPC responsibilities
- Provide paginated list endpoints:
  - customers.listPaged
  - inventory.listPaged
  - salesHistory.listPaged
- Provide create/update for customers.

## DB responsibilities
- Implement paginated queries with filters.
- Add indexes to support filtering and sorting.
- Maintain uniqueness constraints for phone/email.

## Error handling
- Inline errors and toasts within the UI (no alert()).
- IPC errors mapped to user-friendly Spanish messages.

## Performance strategy
- Only fetch current page.
- Avoid loading entire datasets in the renderer.
