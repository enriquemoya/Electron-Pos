# Requirements

## Goal
Add bank transfer support with admin validation, payment status tracking, and customer-safe timeline events without breaking existing order flows.

## Scope
- Cloud API: payment method support, payment status updates, status transition rules, admin validation metadata, expiration scoping.
- Data: Prisma enum/model updates and migration backfill safety.
- Online store: checkout payment option, admin transition modal behavior, customer timeline rendering.
- Email templates: wire payment instructions, absolute asset URL fallback, non-blocking send behavior.

## Non-Goals
- No public endpoint renames.
- No checkout/cart redesign.
- No shipment user flow enablement in this release.
- No breaking response shape changes.

## Constraints
- UUID remains internal order identifier.
- Existing order rows must remain valid after migration.
- Existing pickup pay-in-store flow must continue to work.
- Existing auth boundaries must remain unchanged.
- Spec documents must be English-only and ASCII-only.

## Domain Terms
- Enum status currently used by code: `PENDING_PAYMENT`.
- Business alias in this spec matrix: `AWAITING_PAYMENT`.
- Mapping: `AWAITING_PAYMENT` maps to enum value `PENDING_PAYMENT`.

## Payment Method and Payment Status
- Add `PaymentMethod.BANK_TRANSFER`.
- Ensure `PaymentStatus` contains `PENDING_TRANSFER`, `PAID`, `FAILED`, `REFUNDED`.
- For new transfer orders:
  - initial `paymentStatus = PENDING_TRANSFER`
  - after admin approval `paymentStatus = PAID`
- For existing rows:
  - backfill `paymentStatus = PAID` when missing legacy value context.

## Full Transition Matrix
The release keeps shipping statuses in schema but feature-disabled in transitions.

| From | To | Scenario | Allowed | Notes |
|---|---|---|---|---|
| DRAFT (preorder draft aggregate) | CREATED | checkout conversion | yes | draft is not persisted as OnlineOrderStatus |
| CREATED | AWAITING_PAYMENT (`PENDING_PAYMENT`) | all | yes | system normalization |
| AWAITING_PAYMENT (`PENDING_PAYMENT`) | PAID | pickup + pay_in_store | yes | compatibility path retained |
| AWAITING_PAYMENT (`PENDING_PAYMENT`) | PAID_BY_TRANSFER | pickup + wire_transfer | yes | requires admin approval |
| AWAITING_PAYMENT (`PENDING_PAYMENT`) | PAID | pickup + online_card (future) | yes | future provider path |
| AWAITING_PAYMENT (`PENDING_PAYMENT`) | CANCELLED_EXPIRED | unpaid scenarios | yes | expiration rule |
| AWAITING_PAYMENT (`PENDING_PAYMENT`) | CANCELLED_MANUAL | admin cancel | yes | requires reason |
| PAID_BY_TRANSFER | READY_FOR_PICKUP | pickup + wire_transfer | yes | after payment approval |
| PAID | READY_FOR_PICKUP | pickup scenarios | yes | standard pickup prep |
| READY_FOR_PICKUP | COMPLETED | pickup scenarios | yes | terminal success state |
| READY_FOR_PICKUP | CANCELLED_MANUAL | admin cancel | yes | reason required |
| READY_FOR_PICKUP | SHIPPED | shipping future | no | feature-disabled |
| SHIPPED | COMPLETED | shipping future | no | feature-disabled |
| any terminal | any non-terminal | all | no | terminal is final |

Terminal statuses in current release:
- `COMPLETED`
- `CANCELLED_EXPIRED`
- `CANCELLED_MANUAL`

Feature-disabled status in current release:
- `SHIPPED` exists in enum but must be unreachable.

## Expiration Behavior
- Transfer orders in `PENDING_PAYMENT` expire after 10 days if transfer is not approved.
- Non-transfer `PENDING_PAYMENT` expiration remains supported for backward-compatible pending orders.
- `PAID_BY_TRANSFER`, `PAID`, `READY_FOR_PICKUP`, and `COMPLETED` must not be auto-expired.
- Auto-cancel must release reservations and restore stock.

## Admin Validation and Timeline
- Transition to `PAID_BY_TRANSFER` requires admin actor context.
- Status log row must be written in the same transaction as the order update.
- Customer timeline payload must not expose raw internal admin IDs.
- Customer timeline event fields must include:
  - `actorDisplayName`
  - `actorType` (`ADMIN` or `SYSTEM`)
  - optional `adminMessage`

## Email Behavior
- On transfer order creation, include:
  - wire payment image URL `/assets/wire_payment.jpg`
  - WhatsApp CTA `https://wa.me/526621814655`
- Image URL must be absolute:
  - primary: `ONLINE_STORE_BASE_URL`
  - fallback: brand site URL from branding config
- If both sources are unavailable, generation still succeeds with a deterministic safe absolute fallback URL.
- Email sending must be non-blocking and must not fail order creation/transition.

## UI Requirements
- Checkout shows transfer payment option.
- Transfer selection does not auto-pay.
- Admin status transition requires confirmation modal before submit.
- Modal supports optional admin message input.
- Disabled statuses such as `SHIPPED` are hidden in current UI.

## Error Handling
- Reject transfer approval for non-transfer orders.
- Reject transfer approval when required admin context is missing.
- Reject invalid status transitions in application layer.
- Reject transitions to feature-disabled statuses.

## Acceptance Criteria
1) Spec docs are ASCII-only and English-only.
2) Transition matrix is explicit and complete for current and future scenarios.
3) Admin modal requirement is explicit in tasks and implemented.
4) `READY_FOR_PICKUP -> PAID` is disallowed.
5) `READY_FOR_PICKUP -> COMPLETED` is allowed.
6) `SHIPPED` is unreachable in current release.
7) Customer timeline has no internal admin UUID leakage.
8) Builds pass for `apps/cloud-api` and `apps/online-store`.
9) Strict implementation audit verdict is SAFE.
