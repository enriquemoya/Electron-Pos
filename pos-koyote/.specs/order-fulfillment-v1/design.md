# order-fulfillment-v1 design

## High-level architecture
- cloud-api owns order lifecycle state transitions and expiration.
- online-store consumes cloud-api for admin and customer order views.
- data layer stores canonical order state, transition logs, and reservation state.
- email notifications are rendered from `packages/email-templates` and sent through existing email port.

## Layered boundaries (cloud-api)
- Presentation:
  - Admin order endpoints
  - Customer order endpoints
  - Job trigger endpoint or internal scheduler hook
  - Request validation and response mapping only
- Application:
  - Use cases for listing orders, reading details, transitioning status, running expiration
  - Transition guard matrix and authorization checks
  - Orchestration of audit logging, inventory restitution, and notification dispatch
- Domain:
  - Order status value object / transition policy
  - Invariants for allowed status changes
- Infrastructure:
  - Prisma repositories for orders, reservations, audit log
  - Email adapter using existing email service port
  - Scheduler wiring for cron-style expiration execution

## Canonical lifecycle and transitions
- Canonical statuses:
  - CREATED
  - PENDING_PAYMENT
  - PAID
  - READY_FOR_PICKUP
  - SHIPPED
  - CANCELLED_EXPIRED
  - CANCELLED_MANUAL

- Allowed transitions:
  - CREATED -> PENDING_PAYMENT
  - CREATED -> PAID
  - PENDING_PAYMENT -> PAID
  - PAID -> READY_FOR_PICKUP
  - READY_FOR_PICKUP -> PAID (only when pickup + pay-in-store)
  - READY_FOR_PICKUP -> SHIPPED
  - PENDING_PAYMENT -> CANCELLED_EXPIRED
  - PENDING_PAYMENT -> CANCELLED_MANUAL
  - PAID -> CANCELLED_MANUAL
  - READY_FOR_PICKUP -> CANCELLED_MANUAL

- Terminal statuses:
  - SHIPPED
  - CANCELLED_EXPIRED
  - CANCELLED_MANUAL

Pickup/pay-in-store condition model (v1):
- `paymentMethod = PAY_IN_STORE` is required for the conditional transition.
- Pickup context is represented by existing order context; no separate
  fulfillment field is added in this spec.
- Future non-pickup flows must add explicit fulfillment attributes before this
  rule is reused outside pay-in-store pickup paths.

## Data model updates
- Existing tables (expected):
  - online_orders
  - online_order_items
  - inventory_reservations

- Additive updates if missing:
  - Extend `online_orders.status` enum with:
    - CREATED
    - READY_FOR_PICKUP
    - SHIPPED
    - CANCELLED_MANUAL
  - Keep existing values for backward compatibility.
  - If legacy `CANCELED` exists, map it to `CANCELLED_MANUAL` in migration/read logic.
  - Add `online_orders.status_updated_at` timestamp.
  - Add `online_orders.cancel_reason` nullable text.
  - Add `online_orders.cancelled_by_user_id` nullable uuid (admin actor when manual cancel).
  - Create `online_order_status_log` table:
    - id
    - order_id
    - from_status
    - to_status
    - reason
    - actor_user_id (nullable for system expiration)
    - created_at
  - Indexes:
    - online_orders(user_id, created_at desc)
    - online_orders(status, expires_at)
    - online_order_status_log(order_id, created_at desc)

## API contracts
### Admin
- GET `/admin/orders`
  - Query: `page`, `pageSize`, `q`, `status`, `sort`, `direction`
  - Response: paginated order summaries
- GET `/admin/orders/:orderId`
  - Response: full order detail + status timeline
- POST `/admin/orders/:orderId/status`
  - Body: `toStatus`, `reason?`
  - Behavior: validates transition in application use case

### Customer
- GET `/orders`
  - Authenticated user only
  - Response: user order history (paginated)
- GET `/orders/:orderId`
  - Authenticated owner only
  - Response: user order detail + timeline

### Internal/system expiration
- Scheduler invokes expiration use case periodically (cron-style).
- Optional protected internal route may trigger the same use case for ops.

## Expiration mechanism
- Primary mechanism: scheduled server-side job.
- Job query:
  - status = PENDING_PAYMENT
  - expires_at <= now
  - not already cancelled
- For each match:
  - transition to CANCELLED_EXPIRED
  - release active reservations
  - restore inventory
  - append status log entry with system actor null
  - enqueue/send status email
- Idempotency:
  - skip orders already terminal
  - skip reservations already released

## Inventory restitution flow
1. Load active reservations for target order.
2. For each reservation:
  - increase `read_model_inventory.available` by reserved quantity
  - mark reservation status as RELEASED
3. Commit in one transaction with order status update and status log insert.

## Email notification design
- Template package: `packages/email-templates`
- Templates:
  - `order-created`
  - `order-status-updated`
- Inputs:
  - locale
  - order id/reference
  - new status
  - summary fields (branch, total, dates)
- Sending:
  - application layer emits notification request
  - infrastructure email adapter sends through existing email port
- Reliability:
  - status transition is source of truth
  - email failure is logged and does not rollback committed state change

## Online-store UI behavior
### Admin area
- New orders management page:
  - list + filters + pagination
  - detail panel/page
  - transition actions with confirmation dialog
  - reason input required for manual cancel

### Customer area
- `/[locale]/account/orders`
  - list user orders
- `/[locale]/account/orders/[orderId]`
  - order detail and timeline

## State ownership
- Order lifecycle state: cloud-api/data authoritative.
- Transition policy: cloud-api application layer authoritative.
- UI labels and rendering: online-store.
- Notification content: email templates package + locale input.

## Error and edge cases
- Invalid transition request:
  - reject with stable 400 error
- Conditional transition enforcement:
  - `READY_FOR_PICKUP -> PAID` requires pickup + pay-in-store order attributes
  - any mismatch rejects with semantic 400 error body
- Order not found:
  - 404
- Customer attempting access to another user order:
  - 403
- Expiration race with admin update:
  - transactional update with latest status check
- Duplicate scheduler executions:
  - idempotent terminal checks prevent double restitution

## i18n and accessibility
- Admin and customer order pages use next-intl strings only.
- Status labels in UI mapped from canonical enums via localized dictionary.
- Action confirmations and errors are keyboard accessible.
- Email templates include localized subject and body content.
