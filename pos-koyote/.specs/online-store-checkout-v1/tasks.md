# Tasks: Online Store Checkout v1

## Phase 1: Data model
1. Add Prisma models for pickup branches, pre-order drafts, order entities,
   and inventory reservations.
2. Add indexes for userId, order status, and expiresAt.
3. Generate and apply migrations (data-only changes).

## Phase 2: Cloud API - drafts and revalidation
1. Implement use cases for draft create/update and inventory revalidation.
2. Implement repository interfaces for inventory reads and draft persistence.
3. Add controllers and routes for /checkout/drafts and /checkout/revalidate.
4. Server-side override of priceSnapshot and availabilitySnapshot using authoritative sources.
5. Add error mapping and validation for cart item payloads.

## Phase 3: Cloud API - orders and expiration
1. Implement order creation use case (pay_in_store only) with inventory reservation.
2. Set expiresAt = createdAt + 10 natural days for pay_in_store orders.
3. Implement expiration check and reservation release logic (idempotent).
3. Add /checkout/orders endpoint with JWT auth.
4. Add order read endpoints if needed for status display.

## Phase 4: Branch management
1. Implement pickup branch admin CRUD endpoints (admin-only).
2. Implement public branch list endpoint for checkout selection.
3. Add branch validation for order creation.

## Phase 5: Online-store checkout UX
1. Add checkout route and UI with branch selection and pay-in-store option.
2. Add server actions or route handlers to call Cloud API securely.
3. Trigger revalidation on cart/checkout load and show toasts on removals.
4. Persist draft on checkout entry and handle draft updates.

## Phase 6: QA and i18n
1. Localize all checkout strings and toasts via next-intl.
2. Validate cart removal warnings and expiration edge cases.
3. Confirm no secrets are exposed in client components.
