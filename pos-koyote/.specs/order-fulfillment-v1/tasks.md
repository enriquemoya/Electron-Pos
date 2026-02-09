# order-fulfillment-v1 tasks

## Phase 1: Data and domain contracts
1. Add/extend Prisma enums for canonical `OrderStatus` lifecycle values.
2. Add additive fields to `online_orders` for lifecycle metadata:
   - `status_updated_at`
   - `cancel_reason`
   - `cancelled_by_user_id`
3. Create `online_order_status_log` table and indexes.
4. Add migration with forward-only schema changes and rollback-safe defaults.
5. Implement domain transition policy and validation matrix.

## Phase 2: Cloud API application and infrastructure
1. Add application use case for admin status transition with invariant checks.
2. Add application use case for customer order history/detail read.
3. Add application use case for expiration sweep (cron execution entrypoint).
4. Add repository methods for:
   - paginated order list/detail for admin
   - owner-scoped order list/detail for customer
   - transactional transition + audit/status-log write
   - reservation release + inventory restitution
5. Ensure transition use cases are the only path for status mutation.
6. Wire email notification dispatch through existing email port.
7. Add non-blocking operational logging for email send failures.

## Phase 3: Cloud API presentation routes
1. Add admin routes:
   - `GET /admin/orders`
   - `GET /admin/orders/:orderId`
   - `POST /admin/orders/:orderId/status`
2. Add customer routes:
   - `GET /orders`
   - `GET /orders/:orderId`
3. Add request validation for query params and transition payloads.
4. Enforce auth and role checks:
   - admin routes require admin role
   - customer routes require authenticated owner access
5. Add scheduler wiring for expiration use case (cron-style execution).

## Phase 4: Email template package
1. Create `packages/email-templates` package if absent.
2. Add React Email templates:
   - order created
   - order status updated
3. Add template renderer exports for cloud-api usage.
4. Add localized content support for es and en.
5. Add tests/snapshots for template rendering inputs.

## Phase 5: Online-store admin UI
1. Add admin orders list page with:
   - search
   - status filter
   - pagination
2. Add admin order detail page with timeline.
3. Add status transition action UI with confirmation dialog.
4. Require reason input for manual cancellation action.
5. Keep all strings localized with next-intl.

## Phase 6: Online-store customer UI
1. Add customer order history page at `/[locale]/account/orders`.
2. Add customer order detail page at `/[locale]/account/orders/[orderId]`.
3. Render localized status labels and timeline events.
4. Add empty and error states with localized copy.

## Phase 7: QA and governance checks
1. Verify all allowed transitions succeed and invalid transitions fail with stable 400.
2. Verify `READY_FOR_PICKUP -> PAID` is guarded by pickup + pay-in-store conditions.
3. Verify the current v1 model keeps `paymentMethod = PAY_IN_STORE` as the mandatory condition for this transition, and document that future non-pickup/non-pay-in-store flows require explicit rejection rules when introduced.
4. Verify expiration job cancels overdue unpaid orders and restores inventory.
5. Verify admin manual cancel restores inventory and writes status log.
6. Verify customer cannot read another customer's orders.
7. Verify email notifications trigger on creation and all status transitions.
8. Verify build and type checks pass for cloud-api and online-store.
9. Run implementation audit against `order-fulfillment-v1`.
