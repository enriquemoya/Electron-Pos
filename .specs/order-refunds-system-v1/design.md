# Design

## Data Model

### Enums
- Extend `OnlineOrderStatus` with `CANCELLED_REFUNDED`.
- Add `RefundMethod` enum:
  - `CASH`
  - `CARD`
  - `STORE_CREDIT`
  - `TRANSFER`
  - `OTHER`
- Add derived response enum `OrderItemRefundState`:
  - `NONE`
  - `PARTIAL`
  - `FULL`

### Refund Table
`online_order_refunds`
- `id` UUID primary key
- `order_id` UUID not null, FK to `online_orders(id)`
- `order_item_id` UUID nullable, FK to `online_order_items(id)`
- `amount` integer or existing project money scalar, not null
- `refund_method` enum `RefundMethod`, not null
- `admin_id` UUID nullable (internal)
- `admin_name` text not null
- `admin_message` text not null
- `created_at` timestamp not null default now

Indexes:
- `online_order_refunds(order_id)`
- `online_order_refunds(order_item_id)`
- optional composite index `(order_id, created_at desc)`

### Ledger Integration
- Append one payment entry per refund action.
- Entry characteristics:
  - method/classification: `REFUND`
  - status: `SETTLED`
  - amount: refund amount
  - metadata includes `refundMethod`, `adminName`, `orderItemId` when present
- Recompute ledger in the same transaction.

Invariants:
- `sum(refunds.amount)` cannot exceed refundable paid amount.
- `balanceDue` cannot be negative.
- If refund sum reaches paid threshold, order status becomes `CANCELLED_REFUNDED`.

## Contracts

### New Admin Endpoint
`POST /admin/orders/:orderId/refunds`

Request body:
- `orderItemId?: string`
- `amount: number`
- `refundMethod: RefundMethod`
- `adminMessage: string`

Response:
- existing order detail shape plus additive fields:
  - `refunds[]`
  - `totals` with refund totals
  - item `refundState`

### Existing Customer Endpoint (Additive)
Existing customer order detail responses include:
- `refunds[]` with redacted actor fields
- `totals` with subtotal and refund totals
- item-level `refundState`

Customer refunds entry shape excludes `adminId` and `actorUserId`.

## State and Transition Rules

### Refund Eligibility
- Allowed status for refund creation: `COMPLETED` only.
- Disallowed: `CREATED`, `PENDING_PAYMENT`, `PAID`, `PAID_BY_TRANSFER`, `READY_FOR_PICKUP`, `SHIPPED`, and all cancelled statuses.

### Status Change by Refund Aggregate
- If cumulative refunds < paid threshold: status remains `COMPLETED`.
- If cumulative refunds == paid threshold: `COMPLETED -> CANCELLED_REFUNDED`.
- If cumulative refunds > paid threshold: reject with `REFUND_INVALID_AMOUNT`.

### Terminal Protection
No manual transition from terminal statuses:
- `COMPLETED`
- `CANCELED`
- `CANCELLED_EXPIRED`
- `CANCELLED_MANUAL`
- `CANCELLED_REFUNDED`

## Flow Design

### Admin Refund Flow
1. Admin opens order detail for a `COMPLETED` order.
2. Admin clicks `Issue refund`.
3. Dialog captures target scope (item or full order), amount, method, message.
4. API validates role and refund invariants.
5. Service transaction writes refund row, appends ledger entry, recomputes ledger, updates status when needed, and writes status history event.
6. API responds with updated order detail projection.

### Customer Read Flow
1. Customer requests existing order detail route.
2. Mapper includes refund rows redacted for customer fields.
3. Mapper computes item refund state and totals summary.

### Admin Orders List Popover
1. User clicks displayed total in list row.
2. Popover renders item subtotal lines, refund lines, and final total.
3. Values are read-only and consistent with detail totals.

## Error Model
- `403 FORBIDDEN` when non-admin calls admin refund endpoint.
- `404 ORDER_NOT_FOUND` when order ID is missing.
- `400 REFUND_NOT_ALLOWED_FOR_STATUS` when status is not `COMPLETED`.
- `400 REFUND_INVALID_AMOUNT` for invalid amount constraints.
- `400 REFUND_ITEM_NOT_FOUND` when `orderItemId` does not belong to order.

## Security and Privacy
- Admin endpoint remains admin-auth protected.
- Customer payload never exposes `adminId`, `actorUserId`, or internal actor UUIDs.
- Admin snapshots (`admin_name`, `admin_message`) are immutable after write.

## UI Architecture
- Admin refund modal uses shadcn components: `Dialog`, `Select`, `Input`, `Textarea`, `Button`.
- Admin list total breakdown uses shadcn `Popover` and grid/table layout.
- Item refund state uses shadcn `Badge`.
- All user-visible copy is sourced from i18n messages.

## Edge Cases
- Multiple partial refunds on same item across time.
- Full item refund after prior partial refund (cap remaining only).
- Full order refund after mixed partial item refunds.
- Refund amount precision mismatch handling according to existing money type.
- Concurrent refunds on same order: transaction and invariant checks prevent over-refund.
