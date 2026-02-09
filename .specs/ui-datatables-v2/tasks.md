# UI DataTables v2 — Tasks

## Phase 1: DB
- Add paginated query helpers:
  - customers listPaged (filters: name, phone, email)
  - inventory listPaged (filters: name, gameTypeId, stockStatus)
  - sales listPaged (filters: date range, payment method, customer)
- Add indexes for filter columns and sorting.

## Phase 2: IPC
- Expose IPC endpoints for paginated lists.
- Ensure payloads include total count and paging info.
- Preserve existing detail endpoints.

## Phase 3: UI migration
- Replace Customers, Inventory, Sales History lists with Shadcn DataTable.
- Add filter bars and pagination controls.
- Ensure i18n usage for all labels.

## Phase 4: Customers modals
- Create/Edit in Dialog.
- Enforce phone/email rules with inline errors.

## Phase 5: Sales detail routing
- Ensure row click navigates to detail route.
- Keep detail page layout intact.

## Phase 6: Validation & UX polish
- Loading/empty states.
- Disabled states for pagination and actions.
