# Design: Sales History (Sales History)

## Sale List Model
- SaleSummary:
  - id
  - createdAt
  - total
  - paymentMethod
  - proofStatus

## Proof Status Concept
- ATTACHED: proof present or not required.
- PENDING: proof missing for Transfer/Card.

## UI Flows
- List:
  - Table/list with sales and proof status.
- Filters:
  - Date, payment method, proof status.
- Detail:
  - Full sale information.
  - Show customer when method is Store Credit.
  - "Reimprimir ticket" button.
  - If PENDING, "Adjuntar comprobante" button.
- Attach proof:
  - File selection (image/PDF).
  - Upload via IPC.

## Visual Rules
- PENDING sales show warning icon and color.
- ATTACHED sales show neutral state.

## Responsibilities
- Domain (packages/core):
  - Sale and proofStatus types.
- DB (packages/db):
  - Filtered queries and proof status queries.
- IPC (apps/desktop):
  - getSales with filters.
  - getPendingProofSales.
  - attachProofToSale.
- UI (apps/web):
  - List, filters, detail.
  - Visual mapping of status.
  - Customer lookup by customerId when applicable.

## IPC Usage
- Renderer only calls window.api.*
- No direct SQLite access.

## Error Handling
- Inline messages.
- If Drive fails when attaching, keep PENDING.

## Persistence Strategy
- SQLite stores proof_status and proof_file_ref.
- Drive stores files as mirror.

## Future Extensions
- Export CSV.
- Pending notifications.
- Product search.
