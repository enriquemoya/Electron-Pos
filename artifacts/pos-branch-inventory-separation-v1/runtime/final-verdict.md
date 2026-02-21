# Final Verdict - pos-branch-inventory-separation-v1 (Runtime Mini-Pack)

Date: 2026-02-20T22:06:30Z

## Evidence paths
- API:
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/employee-decrement-forbidden.request.txt
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/employee-decrement-forbidden.headers.txt
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/employee-decrement-forbidden.response.json
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/employee-increment-allowed.request.txt
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/employee-increment-allowed.headers.txt
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/employee-increment-allowed.response.json
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/admin-decrement-allowed.request.txt
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/admin-decrement-allowed.headers.txt
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/admin-decrement-allowed.response.json
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/sync-snapshot.request.txt
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/sync-snapshot.headers.txt
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/sync-snapshot.response.json
  - artifacts/pos-branch-inventory-separation-v1/runtime/api/sync-zero-stock.assertion.json
- Offline queue:
  - artifacts/pos-branch-inventory-separation-v1/runtime/offline/queue-before.txt
  - artifacts/pos-branch-inventory-separation-v1/runtime/offline/queue-after.txt
  - artifacts/pos-branch-inventory-separation-v1/runtime/offline/retry-log.txt
- Gates:
  - artifacts/pos-branch-inventory-separation-v1/runtime/command-gates.txt

## P1 status
1. EMPLOYEE decrement forbidden (RBAC_FORBIDDEN): PASS
2. EMPLOYEE increment allowed: PASS
3. ADMIN decrement allowed on POS admin endpoint: PASS
4. Full catalog snapshot includes product with zero branch stock (branchQuantity=0): PASS
5. Offline queue persists pending event and transitions to SYNCED only after successful retry: PASS

## Notes
- Runtime fix applied before evidence capture:
  - apps/cloud-api/src/infrastructure/repositories/inventory-service.ts
  - `findUnique({ where: { idempotencyKey } })` was invalid for the named unique index in Prisma.
  - Updated to `findFirst({ where: { idempotencyKey } })` for deterministic idempotency lookup.

## Final
VERDICT: SAFE
