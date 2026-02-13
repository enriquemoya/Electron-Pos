# Tasks

## Phase 1 - Spec Validation
- Validate requirements against scope constraints and exclusions.
- Run strict spec audit and resolve blockers.

## Phase 2 - Prisma Schema (Additive)
- Add payment-domain enums:
  - payment ledger state enum
  - payment entry method enum
  - payment entry status enum
  - actor/source enums for audit metadata
- Add models:
  - `OrderPaymentLedger`
  - `OrderPaymentEntry`
- Keep current `OnlineOrder` fields unchanged.

## Phase 3 - Migration and Backfill
- Create production-safe migration for new tables and enums.
- Backfill one ledger per existing order.
- Backfill compatibility payment entry per existing order.
- Recompute and persist `totalDue`, `totalPaid`, `balanceDue`, `state`.
- Keep migration idempotent-safe where possible and non-destructive.

## Phase 4 - Repository and Domain Logic
- Implement transactional payment-entry write path.
- Implement ledger recomputation utility.
- Implement compatibility mapping to existing `paymentStatus`/`paymentMethod`.
- Ensure no lifecycle status transitions are changed.
- Make `ensurePaymentLedger` race-safe with `upsert` (or P2002 retry fallback).
- Enforce overpay rejection in recompute and rollback transaction.

## Phase 5 - API Compatibility Layer
- Preserve existing endpoint contracts and response shapes.
- Add optional internal/admin-facing fields only where safe and additive.
- Keep current checkout behavior functional without requiring new client payload.

## Phase 6 - Security and Audit
- Enforce admin-auth for payment mutation operations.
- Persist actor metadata and source channel on every payment entry.
- Add validation errors for invalid amounts, currency mismatch, and overpay attempts.

## Phase 7 - Verification
- Validate no lifecycle state machine diffs in this spec scope.
- Validate backward compatibility for current create-order and order-read flows.
- Run strict spec audit:
  - `npm run gov:spec:audit -- "order-payment-domain-refactor-v1"`
