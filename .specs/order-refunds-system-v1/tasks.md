# Tasks

## Phase 1 - Spec and Audit
- Create requirements, design, and tasks docs for `order-refunds-system-v1`.
- Run strict spec audit and resolve blockers until READY.

## Phase 2 - Data and Prisma
- Extend Prisma enums:
  - `OnlineOrderStatus` add `CANCELLED_REFUNDED`.
  - add `RefundMethod`.
- Add `OnlineOrderRefund` model with indexes on `orderId` and `orderItemId`.
- Create migration for additive schema changes only.
- Ensure no destructive operations and no backfill required for existing orders.

## Phase 3 - Cloud API Domain
- Add refund repository operations and service orchestration.
- Implement `createRefund(orderId, payload, adminContext)` transaction:
  - validate order status and permissions
  - validate amount and refundable remaining
  - create refund record
  - append ledger refund entry
  - recompute ledger
  - set order status to `CANCELLED_REFUNDED` when fully refunded
  - write order status log event with admin snapshot message
- Add derived calculators:
  - `computeRefundTotals(orderId)`
  - `deriveItemRefundState(orderId)`
- Enforce terminal no-revive rule in application layer.

## Phase 4 - API and Mapping
- Add admin-only route `POST /admin/orders/:orderId/refunds`.
- Validate request payload and return stable error codes.
- Extend admin and customer order detail mappers with additive fields:
  - `refunds[]`
  - `totals`
  - item `refundState`
- Redact internal admin IDs from customer payloads.

## Phase 5 - Online Store UI
- Admin order detail:
  - Add `Issue refund` action enabled only for `COMPLETED`.
  - Add shadcn dialog with required fields and validation.
  - Show toasts for success and errors.
- Admin orders list:
  - Add shadcn popover on total with item and refund breakdown.
- Customer and admin detail:
  - Render item refund badges and totals section.
- Disable and hide transition controls for terminal statuses.

## Phase 6 - Validation
- Run `npm run gov:spec:audit -- "order-refunds-system-v1"`.
- Run `npm run prisma:generate -w apps/cloud-api`.
- Run `npm run build -w apps/cloud-api`.
- Run `npm run build -w apps/online-store`.
- Run `npm run gov:impl:audit -- "order-refunds-system-v1"`.
- Report SAFE or NOT SAFE with blocking gaps and file references.
