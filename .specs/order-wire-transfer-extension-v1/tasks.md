# Tasks

## Phase 1 - Spec Audit
- Run: npm run gov:spec:audit -- "order-wire-transfer-extension-v1"
- Resolve any blockers.

## Phase 2 - Schema and Migration
- Update Prisma enums for PaymentMethod, PaymentStatus, OnlineOrderStatus.
- Add `COMPLETED` to OnlineOrderStatus if missing.
- Add OrderStatusHistory admin attribution fields.
- Add migration with backfill: paymentStatus = PAID for existing orders.
- Ensure migration is additive and safe for existing rows.

## Phase 3 - Cloud API
- Enforce transition rules in application use-case with enum-based maps.
- Disallow `READY_FOR_PICKUP -> PAID`.
- Allow `READY_FOR_PICKUP -> COMPLETED`.
- Block feature-disabled transitions (`READY_FOR_PICKUP -> SHIPPED`, `SHIPPED -> COMPLETED`) in current release.
- Require admin fields for transfer approval.
- Ensure status history entry is created transactionally.
- Scope expiration to unpaid `PENDING_PAYMENT` scenarios only.
- Keep 10-day rule and reservation release behavior.

## Phase 4 - Online Store
- Add payment option in checkout UI.
- Add explicit admin status change confirmation modal with irreversible action copy.
- Modal must include optional admin message input.
- Hide feature-disabled statuses from admin selectors.
- Update customer order timeline to avoid internal UUID exposure.

## Phase 5 - Email Templates
- Add wire payment image using absolute URL.
- Add WhatsApp CTA copy and button.
- Add status update email for PAID_BY_TRANSFER.
- Implement base URL fallback order: ONLINE_STORE_BASE_URL -> brand site URL -> deterministic absolute fallback.
- Keep email sending non-blocking for order creation and transition.

## Phase 6 - Audits and Build
- npm run prisma:generate -w apps/cloud-api
- npm run build -w apps/cloud-api
- npm run build -w apps/online-store
- npm run gov:spec:audit -- "order-wire-transfer-extension-v1"
- npm run gov:impl:audit -- "order-wire-transfer-extension-v1"
