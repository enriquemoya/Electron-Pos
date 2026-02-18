# Requirements

## Goal
Add a full and partial refunds system on top of existing order and payment ledger behavior, with auditable admin actions and additive customer and admin read models.

## Scope
- Cloud API: refund domain rules, admin refund endpoint, additive order detail fields, terminal transition guards.
- Data: additive Prisma schema and migration for refunds and status extension.
- Online store: admin refund modal, admin list totals popover, customer and admin totals and refund state display.
- Customer orders history list: additive totals and totals breakdown payload with popover UI.

## Non-Goals
- No checkout or cart redesign.
- No shipment UI enablement.
- No endpoint removals or breaking API contract changes.
- No exposure of internal admin UUIDs in customer payloads.

## Constraints
- Additive changes only for schema and API payloads.
- Existing order state machine remains intact unless explicitly extended for refunds.
- Existing payment ledger semantics for create order and transfer approval remain intact.
- Existing orders must remain valid after migration.
- Spec documents must be English only and ASCII only.
- All refund UI copy must be localized in both `es-MX` and `en-US` message catalogs.

## Refund Capabilities
- Admin can issue refunds only for orders in `COMPLETED` by default.
- Refund types:
  - Full item refund.
  - Partial item refund.
  - Full order refund.
- Every refund record must capture:
  - `adminDisplayName` (required snapshot)
  - `adminMessage` (required)
  - `refundMethod` (required): `CASH`, `CARD`, `STORE_CREDIT`, `TRANSFER`, `OTHER`
  - `refundAmount` (required)
  - `orderItemId` (required for item-level, nullable for full order)
  - `createdAt` (server timestamp)
- Refunds are append-only and non-destructive.

## Lifecycle and Terminal Rules
- Introduce terminal status `CANCELLED_REFUNDED`.
- Terminal statuses are:
  - `COMPLETED`
  - `CANCELED`
  - `CANCELLED_EXPIRED`
  - `CANCELLED_MANUAL`
  - `CANCELLED_REFUNDED`
- Terminal orders do not allow manual status transitions.
- API must enforce terminal transition rejection regardless of UI behavior.

## Refund to Status Outcome
- If cumulative refunds reach the paid amount limit, transition `COMPLETED -> CANCELLED_REFUNDED`.
- Partial refunds keep status `COMPLETED`.
- Refunds are rejected for `PENDING_PAYMENT`, `CREATED`, and `READY_FOR_PICKUP`.

## Item Refund State
Each order item must expose derived state:
- `NONE`
- `PARTIAL`
- `FULL`

Both customer and admin order detail payloads include this derived item state.

## Totals Breakdown
Order detail for customer and admin must expose additive totals:
- `subtotal`
- `refundsTotal`
- `finalTotal` (`subtotal - refundsTotal`)
- `paidTotal` (from payment ledger)
- `balanceDue` (from payment ledger, never negative)

Customer order history list items must include additive totals fields:
- `totals: { subtotalCents, refundsCents, totalCents, currency }`
- `totalsBreakdown: { items: [{ productName, qty, lineTotalCents }], refunds: [{ productName, amountCents, type, method }] }`
- Existing list fields remain unchanged.

## Admin List Totals Popover
Admin orders list must expose a UI popover for totals breakdown:
- Item lines with quantity and line totals.
- Refunded lines with amount and refund state label.
- Final total.

## Customer List Totals Popover
Customer order history list must show final total after refunds.
- Total cell shows `totals.totalCents` when available.
- Click total opens shadcn popover with:
  - item subtotal rows (`productName`, `qty`, `lineTotal`)
  - refund rows (`productName`, `amount`, `type`, `method`)
  - final total row
- Popover uses premium dark layout and aligned columns.

## API Rules
- Customer payloads cannot include internal admin IDs.
- Customer refund history exposes only:
  - `adminDisplayName`
  - `adminMessage`
- Admin payloads may include internal IDs for audit use.
- Customer list payload must not expose admin IDs, actor IDs, or internal actor UUIDs.

## Error Handling
Stable errors:
- `REFUND_INVALID_AMOUNT` for non-positive amount or amount above refundable remaining.
- `REFUND_NOT_ALLOWED_FOR_STATUS` for invalid order status.
- `ORDER_NOT_FOUND` for missing order.
- `FORBIDDEN` for non-admin refund attempts.

Additional behavior:
- Full-order refund with remaining refundable amount equal to zero returns `REFUND_INVALID_AMOUNT`.
- Multiple partial refunds cannot exceed item refundable remaining or order paid remaining.
- Transaction failures must rollback refund record and ledger entry together.
- If customer list `totalsBreakdown` is unavailable, UI falls back to existing subtotal display and a localized muted label (`totalsPending`).

## i18n Completeness
Refund UI key sets must exist in both locales (`es-MX`, `en-US`) with matching structure.
Required groups:
- refund labels: refund/refunds, full/partial, refunded states
- refund form labels: reason, admin comment, method labels
- totals labels: subtotal, refunds, total
- fallback label: totals pending

## Acceptance Criteria
1) Admin refund endpoint supports full and partial refunds.
2) Refund records are append-only with admin name and message snapshots.
3) Customer payload does not leak internal admin UUIDs.
4) Item refund states and totals are shown in customer and admin order detail.
5) Full paid refund transitions status to `CANCELLED_REFUNDED`.
6) Terminal orders cannot be manually revived.
7) Admin list total popover renders item and refund breakdown.
8) Customer order history list total uses final total after refunds and shows popover breakdown.
9) Builds pass for `apps/cloud-api` and `apps/online-store`.
10) Spec audit is READY and implementation audit is SAFE.
