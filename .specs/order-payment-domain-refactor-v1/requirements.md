# Requirements

## Goal
Refactor the order payment domain to support multi-payment records, store credit application, partial payments, and future provider extensibility while keeping existing order lifecycle behavior unchanged.

## Scope
- Modules: `cloud-api`, `data`.
- Introduce a payment-domain model separated from order lifecycle status.
- Keep current checkout and fulfillment APIs backward-compatible.
- Add migration strategy that preserves all existing orders.

## Non-Goals
- No order lifecycle state machine redesign.
- No fulfillment logic redesign.
- No shipment tracking features.
- No frontend route changes.
- No provider-specific integrations in this phase.

## Constraints
- No API contract breaking changes for current clients.
- Existing order and payment behavior must continue to work.
- UUID remains the internal order identifier.
- Migration must be safe for production and non-destructive.

## Backward Compatibility
- Existing fields (`paymentMethod`, `paymentStatus`) remain available in responses.
- Existing create-order and order-detail endpoints keep current payload shapes.
- New payment-domain data is additive and optional for legacy rows.

## Payment Domain Requirements
- Introduce a new payment aggregate that can contain many payment entries per order.
- Support these payment sources:
  - cash in store
  - bank transfer
  - store credit
  - external provider placeholder (future Stripe, PayPal, others)
- Support partial payment totals:
  - total due
  - total paid
  - remaining balance
- Store credit must be represented as a payment entry, not a lifecycle status.

## Consistency Rules
- Order lifecycle statuses are not modified by this spec.
- Payment aggregate state is derived from payment entries and order total.
- `paymentStatus` compatibility field is derived from aggregate state.
- No direct status mutation without repository transaction boundary.
- `ensurePaymentLedger` must be concurrency-safe and must not fail on duplicate ledger creation races.
- Overpay must be rejected with a validation error and transaction rollback.

## Error Handling
- Reject payment entry creation if:
  - amount is zero or negative
  - currency does not match order currency
  - payment amount would overpay without explicit overpayment policy
  - order is canceled and policy forbids new payments
- Return stable validation errors compatible with current API error model.
- If recompute detects paid amount greater than total due, throw `payment_overpay_not_allowed` and rollback.
- Migration fallback:
  - if legacy order data is inconsistent, create a compatibility payment snapshot and mark audit flag for manual review.

## i18n
- No user-facing copy changes in this scope.
- No locale routing changes in this scope.

## Security and Audit
- Every payment entry must include immutable audit metadata:
  - actor id (nullable for system)
  - actor type (`admin`, `system`, `customer` if applicable)
  - timestamp
  - source channel
- No new public write routes in this phase.
- Admin-only payment mutation routes must keep existing auth guards.

## Acceptance Criteria
1. New payment aggregate and entries are additive and production-safe.
2. Existing API consumers continue to function without payload changes.
3. Partial payments and store credit can be represented in domain data.
4. Compatibility `paymentStatus` remains consistent with aggregate totals.
5. No order lifecycle state machine changes are introduced.
6. Migration backfills existing orders without data loss.
7. Spec passes strict spec audit.
