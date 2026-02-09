# order-fulfillment-v1 requirements

## Problem statement
Orders are created at checkout but there is no complete fulfillment lifecycle for
admin operations and customer visibility. This causes operational gaps in order
tracking, cancellation handling, expiration automation, and communication.

## Goals
- Define one canonical order lifecycle for online-store orders after checkout.
- Enable admin-controlled fulfillment state transitions with auditability.
- Provide customer order history and order detail views in online-store.
- Enforce deterministic expiration for unpaid orders after 10 natural days.
- Restore inventory on cancellation and expiration.
- Send email notifications for order creation and every status transition.
- Keep controllers thin and enforce transitions via application use cases.

## Scope
- cloud-api: order lifecycle state machine, admin/customer order endpoints, expiration job, notification triggers, audit log writes.
- data (Prisma): additive schema updates for lifecycle and audit fields if required.
- online-store: admin order management UI, customer order history/detail UI.
- packages/email-templates: React Email templates rendered server-side for order notifications.

## Non-goals
- No payment gateway integration (Stripe, transfers, wallets).
- No refunds.
- No shipping provider integration.
- No POS synchronization changes.
- No checkout flow changes.

## Constraints
- Applies only to created orders (post-checkout).
- Draft/pre-order behavior remains unchanged except as order input.
- Canonical lifecycle must include:
  - CREATED
  - PENDING_PAYMENT
  - PAID
  - READY_FOR_PICKUP
  - SHIPPED
  - CANCELLED_EXPIRED
  - CANCELLED_MANUAL
- Legacy status `CANCELED` (if present in existing data) must be treated as
  `CANCELLED_MANUAL` during migration and read mapping.
- All status transitions must be validated in application layer use cases.
- Controllers and routes must not execute direct transition logic.
- Email sending must use existing email port and service wiring.
- No direct SMTP calls from controllers.
- Expiration must run server-side with scheduled execution (cron-style).
- Expiration logic must be idempotent and deterministic.
- Inventory restitution must occur for both CANCELLED_EXPIRED and CANCELLED_MANUAL.
- Admin state changes must write an audit record with actor, fromStatus, toStatus, reason, timestamp.
- Public catalog remains read-only and non-authoritative for inventory quantities.
- Do not modify checkout, cart, or payment contracts in this spec.

## Assumptions
- Checkout currently creates orders with a payment method and expiry timestamp.
- Order and reservation tables already exist and can be extended additively.
- Existing auth supports JWT role checks for admin and customer routes.
- Existing email infrastructure supports HTML and text payload delivery.

## Functional requirements
1. Canonical status lifecycle
- Define allowed transitions and reject invalid transitions with stable errors.
- CREATED is reserved for internal creation events before payment state assignment.
- PENDING_PAYMENT is used for pay-in-store and unpaid online flows.
- For pickup + pay-in-store orders, `READY_FOR_PICKUP -> PAID` is allowed to close
  in-store payment at handoff time.
- In v1, pickup context is represented by existing order context while
  `paymentMethod = PAY_IN_STORE` remains mandatory for this transition.
- No new fulfillment field is introduced in this spec.

2. Admin order fulfillment
- Admin can list orders with pagination, search, and status filters.
- Admin can view order detail including items, branch, payment method, expiration, and timeline.
- Admin can transition order status only via allowed transitions.
- Admin must provide a reason for manual cancellation.

3. Customer order visibility
- Authenticated customer can list their own orders.
- Authenticated customer can view only their own order detail.
- Order detail includes status, createdAt, expiresAt, selected branch, and items.

4. Automatic expiration
- Unpaid orders expire exactly 10 natural days after creation.
- Expiration transition is PENDING_PAYMENT -> CANCELLED_EXPIRED.
- Expiration job can run multiple times safely (idempotent).
- For non-pickup shipping-oriented flows (when enabled), payment must still be
  completed before shipping states. The conditional pickup transition does not
  relax shipping payment requirements.

5. Inventory restitution
- On CANCELLED_EXPIRED and CANCELLED_MANUAL:
  - release active inventory reservations
  - restore available counts accordingly
  - update reservation records consistently

6. Email notifications
- Send notification at order created.
- Send notification at every status transition.
- Notifications include order number/id, new status, and relevant summary data.
- Email template rendering uses React Email in `packages/email-templates`.

## i18n requirements
- online-store UI strings must use next-intl for es and en.
- Email templates must support localized content (at minimum es and en variants).
- API response status values remain canonical enum values and are not translated.

## Error handling
- Invalid transition returns 400 with stable error code/message.
- Unauthorized order access returns 403.
- Missing order returns 404.
- Email delivery failure must not rollback valid status transition.
- Email failures must be logged as non-blocking operational errors.
- Expiration and restitution job failures must be logged and retriable.

## Out of scope
- Any changes to checkout UI/flow.
- Any changes to cart behavior.
- Any payment processor integration.
- Any POS/Electron runtime changes.
