# Design

## Data Model
### Enums
- `PaymentMethod`: `PAY_IN_STORE`, `BANK_TRANSFER`
- `PaymentStatus`: `PENDING_TRANSFER`, `PAID`, `FAILED`, `REFUNDED`
- `OnlineOrderStatus`: includes `COMPLETED` and keeps `SHIPPED` as feature-disabled transition target in this release

### OnlineOrder fields
- Keep existing compatibility fields:
  - `paymentMethod`
  - `paymentStatus`
  - `status`
- No field removals.

### Status History fields
- Keep internal audit columns:
  - `approvedByAdminId`
  - `approvedByAdminName`
  - `adminMessage`
  - `actorUserId`
- Add customer-safe projection fields at mapping layer:
  - `actorDisplayName`
  - `actorType`
  - `adminMessage`

## Transition Matrix (Complete)
Business alias `AWAITING_PAYMENT` maps to enum value `PENDING_PAYMENT`.

| From | To | Scenario | Guard | Allowed |
|---|---|---|---|---|
| DRAFT (preorder draft aggregate) | CREATED | checkout conversion | draft exists and validates | yes |
| CREATED | PENDING_PAYMENT | all | system transition | yes |
| PENDING_PAYMENT | PAID | pickup + pay_in_store | payment method match | yes |
| PENDING_PAYMENT | PAID_BY_TRANSFER | pickup + wire_transfer | payment method match + admin validation | yes |
| PENDING_PAYMENT | PAID | pickup + online_card future | feature gate off currently | yes in model, not exposed in UI |
| PENDING_PAYMENT | CANCELLED_EXPIRED | unpaid window exceeded | expiration job | yes |
| PENDING_PAYMENT | CANCELLED_MANUAL | admin cancel | reason required | yes |
| PAID_BY_TRANSFER | READY_FOR_PICKUP | transfer approved | none | yes |
| PAID | READY_FOR_PICKUP | pickup prep | none | yes |
| READY_FOR_PICKUP | COMPLETED | picked up | none | yes |
| READY_FOR_PICKUP | CANCELLED_MANUAL | admin cancel | reason required | yes |
| READY_FOR_PICKUP | PAID | any | illegal reverse transition | no |
| READY_FOR_PICKUP | SHIPPED | shipping future | feature-disabled | no |
| SHIPPED | COMPLETED | shipping future | feature-disabled | no |
| COMPLETED | any | terminal | terminal guard | no |
| CANCELLED_EXPIRED | any | terminal | terminal guard | no |
| CANCELLED_MANUAL | any | terminal | terminal guard | no |

## Flow Design
### Checkout
1. User chooses transfer.
2. Order is created with `paymentStatus=PENDING_TRANSFER` and `status=PENDING_PAYMENT`.
3. Order email is queued asynchronously.

### Admin transfer approval
1. Admin opens transition modal.
2. Admin confirms the action in modal and may include `adminMessage`.
3. Use-case validates transition and payment method.
4. Order update + status log + payment ledger recompute happen in one transaction.
5. Status changed email is queued asynchronously.

### Customer timeline
1. Server maps internal status log rows to safe customer entries.
2. Internal IDs are excluded from customer payload.
3. Customer sees actor display name, actor type, and admin message text.

## Expiration Scoping
- Expire orders only while they are still unpaid (`PENDING_PAYMENT`).
- Do not expire `PAID`, `PAID_BY_TRANSFER`, `READY_FOR_PICKUP`, `COMPLETED`.
- Keep 10-day threshold.
- Reservation release must execute with cancellation transition.

## Email Asset URL Strategy
- Build absolute base URL with precedence:
  1. `ONLINE_STORE_BASE_URL`
  2. branding site URL
  3. deterministic safe fallback absolute URL
- Final image URL format: `{base}/assets/wire_payment.jpg`
- WhatsApp URL: `https://wa.me/526621814655`

## API and Compatibility
- Keep endpoint paths and auth as-is.
- Keep response shapes backward compatible.
- Additive customer-safe fields are allowed.

## Edge Cases
- Missing env base URL values.
- Unknown payment method for approval flow.
- Empty admin message on transfer approval (allowed, but stored as null).
- Attempt to transition to feature-disabled status.
- Legacy records with null or stale status fields after migration.

## Security and Audit
- Transition rules enforced in use-case layer.
- Admin routes remain protected by admin middleware.
- No raw internal admin UUIDs in customer payload.
- Every status transition writes a timeline row.
