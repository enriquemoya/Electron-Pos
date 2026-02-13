# Design

## Data Model

### Existing Models (unchanged behavior)
- `OnlineOrder`
  - keep lifecycle status fields as-is
  - keep compatibility fields `paymentMethod` and `paymentStatus`

### New Models (additive)
- `OrderPaymentLedger`
  - `id` (uuid)
  - `orderId` (fk -> `OnlineOrder`)
  - `currency` (string)
  - `totalDue` (decimal)
  - `totalPaid` (decimal)
  - `balanceDue` (decimal)
  - `state` (enum: `UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERPAID`, `FAILED`)
  - `createdAt`, `updatedAt`

- `OrderPaymentEntry`
  - `id` (uuid)
  - `ledgerId` (fk -> `OrderPaymentLedger`)
  - `orderId` (fk -> `OnlineOrder`, denormalized for query ergonomics)
  - `method` (enum: `PAY_IN_STORE`, `BANK_TRANSFER`, `STORE_CREDIT`, `PROVIDER_EXTERNAL`)
  - `provider` (nullable enum/string placeholder: `NONE`, `STRIPE`, `PAYPAL`, `OTHER`)
  - `providerRef` (nullable string)
  - `amount` (decimal)
  - `currency` (string)
  - `entryStatus` (enum: `PENDING`, `CONFIRMED`, `FAILED`, `REFUNDED`, `VOIDED`)
  - `isStoreCredit` (boolean)
  - `notes` (nullable string)
  - `actorId` (nullable string)
  - `actorType` (enum: `ADMIN`, `SYSTEM`, `CUSTOMER`)
  - `sourceChannel` (enum: `ADMIN_PANEL`, `CHECKOUT`, `JOB`, `API`)
  - `createdAt`, `updatedAt`

### Compatibility Mapping
- `OnlineOrder.paymentStatus` is derived from ledger state:
  - `UNPAID` -> `PENDING_TRANSFER` or existing pending value
  - `PARTIALLY_PAID` -> remains pending-compatible value
  - `PAID` -> `PAID`
  - `FAILED` -> `FAILED`
  - `REFUNDED/VOIDED` aggregate cases -> `REFUNDED` where applicable
- `OnlineOrder.paymentMethod` remains a compatibility snapshot of the primary or latest confirmed method.

## API Contracts
- No breaking changes to existing endpoints.
- Additive extension:
  - internal repository/use-case contracts can return `paymentLedger` and `paymentEntries` for new admin/internal consumers.
  - existing DTO fields remain unchanged and populated.
- No new public checkout contract requirements.

## Flows

### Legacy Order Read
1. Read `OnlineOrder`.
2. If ledger exists, derive compatibility payment fields from ledger.
3. If ledger does not exist, fallback to legacy fields.

### Payment Entry Create (admin/system)
1. Validate order mutability and currency.
2. Validate amount and overpayment policy.
3. Insert `OrderPaymentEntry`.
4. Recompute `OrderPaymentLedger` totals in same transaction.
5. Update compatibility fields on `OnlineOrder` in same transaction.
6. If recompute detects overpay, throw validation error and rollback the whole transaction.

### Store Credit Apply
1. Create payment entry with `method=STORE_CREDIT` and `isStoreCredit=true`.
2. Recompute ledger and compatibility fields transactionally.

## Migration Plan
1. Add new enums and tables (`OrderPaymentLedger`, `OrderPaymentEntry`) without removing existing columns.
2. Backfill one ledger per existing order.
3. Backfill one compatibility payment entry per existing order using legacy payment fields:
  - amount defaults to order subtotal for already-paid legacy orders.
  - pending legacy orders produce pending entry or zero-paid ledger according to status.
4. Keep legacy columns in place for compatibility.

## Edge Cases
- Legacy order marked paid but missing amount consistency:
  - create ledger with `auditMismatch=true` marker in migration metadata table or log table.
- Multiple partial entries across methods:
  - ledger state must become `PARTIALLY_PAID` until balance is zero.
- Overpayment attempt:
  - reject by default and return validation error (`payment_overpay_not_allowed`) with rollback.
- Refund entries:
  - supported by entry status but lifecycle state not changed in this phase.
- Concurrent create/write race:
  - `ensurePaymentLedger` uses upsert or equivalent race-safe retry pattern keyed by unique `orderId`.

## Security and Integrity
- Payment entry writes are transaction-only operations.
- No direct SQL writes from controllers.
- Admin write endpoints remain behind existing admin middleware.
- Immutable audit data on entry creation.
