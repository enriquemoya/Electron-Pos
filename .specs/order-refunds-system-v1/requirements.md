# Requirements

## Goal
Add a full and partial refunds system on top of existing order and payment ledger behavior, with auditable admin actions and additive customer and admin read models.

## Scope
- Cloud API: refund domain rules, admin refund endpoint, additive order detail fields, terminal transition guards.
- Data: additive Prisma schema and migration for refunds and status extension.
- Online store: admin refund modal, admin list totals popover, customer and admin totals and refund state display.

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

## Admin List Totals Popover
Admin orders list must expose a UI popover for totals breakdown:
- Item lines with quantity and line totals.
- Refunded lines with amount and refund state label.
- Final total.

## API Rules
- Customer payloads cannot include internal admin IDs.
- Customer refund history exposes only:
  - `adminDisplayName`
  - `adminMessage`
- Admin payloads may include internal IDs for audit use.

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

## Acceptance Criteria
1) Admin refund endpoint supports full and partial refunds.
2) Refund records are append-only with admin name and message snapshots.
3) Customer payload does not leak internal admin UUIDs.
4) Item refund states and totals are shown in customer and admin order detail.
5) Full paid refund transitions status to `CANCELLED_REFUNDED`.
6) Terminal orders cannot be manually revived.
7) Admin list total popover renders item and refund breakdown.
8) Builds pass for `apps/cloud-api` and `apps/online-store`.
9) Spec audit is READY and implementation audit is SAFE.
