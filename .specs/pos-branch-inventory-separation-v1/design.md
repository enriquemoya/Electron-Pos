# pos-branch-inventory-separation-v1 - Design

## Current Gap
Current inventory behavior mixes global inventory totals into POS sync and can omit products when inventory is zero. This violates branch isolation and prevents full-catalog offline parity.

## Scope Boundaries
- Extend inventory source-of-truth to scoped rows without deleting legacy read models.
- Keep additive endpoint and payload evolution.
- Keep sync architecture and taxonomy parity behavior intact.

## Domain Definitions
- ONLINE_STORE scope:
  - Digital storefront stock.
  - branchId is null.
- BRANCH scope:
  - Physical branch stock.
  - branchId is required.
- Terminal branch:
  - Derived from terminal auth and treated as authoritative for POS movement writes.

## Architecture Chain
### Cloud API
Controller -> Use Case -> Repository -> Storage

### POS
IPC Controller -> Use Case -> Repository -> Storage

### Separation Rules
- Controllers parse and validate shape only.
- Use cases enforce branch and scope rules.
- Repositories execute transactional writes and scoped reads.
- Storage layer remains DB only.

## Data Architecture
### Source of Truth
- inventory_stock becomes stock source-of-truth for scoped quantities.
- inventory_movement becomes immutable audit ledger for adjustments.

### Legacy Compatibility
- read_model_inventory.available remains transitional compatibility field.
- POS sync reads scoped stock rows and does not depend on read_model_inventory.available.

## Sync Read Design
### Snapshot and Delta Semantics
- Base catalog source remains product read model.
- Scoped quantity resolution is added with LEFT JOIN from inventory_stock.
- branchQuantity default is 0 when no scoped row exists.
- Rows are never filtered out by quantity.

### Branch Scoping
- Terminal token resolves branchId in use case.
- Repository query includes branch constraint on scoped inventory join.
- No global stock totals returned to terminal sync routes.

### Version and Idempotency
- Existing snapshot and delta version guards remain unchanged.
- Inventory scope changes must not regress sync version logic.

## Inventory Movement Write Design
### Terminal Endpoint
- POST /pos/inventory/movements
- Use case derives branchId from terminal auth.
- scopeType is forced to BRANCH in terminal path.
- Repository transaction:
  1. Lock or fetch scoped stock row.
  2. Apply delta with non-negative guard policy.
  3. Upsert inventory_stock.
  4. Insert inventory_movement with idempotencyKey.

### Admin Endpoint
- POST /admin/inventory/movements
- Scope is requested by admin payload.
- Validation:
  - BRANCH requires branchId.
  - ONLINE_STORE requires null branchId.
- Same transactional write strategy as terminal path.

### Idempotency
- inventory_movement.idempotencyKey is unique.
- Duplicate key returns stable duplicate code and does not reapply stock mutation.

## Offline POS Behavior
- POS movement requests are written to local queue when offline.
- Retry worker submits queued movements with original idempotencyKey.
- Successful submission marks queue item completed.
- Failed retry retains queue item without destructive overwrite.

## Endpoint Contract Summary
### Terminal Auth Routes
- GET /pos/catalog/snapshot
- GET /pos/catalog/delta
- POST /pos/inventory/movements

### Admin RBAC Routes
- POST /admin/inventory/movements
- GET /admin/inventory/stock

Contract constraints:
- No breaking response changes for existing consumers.
- Additive fields may include branchQuantity and scope metadata.

## Security and Isolation
- Terminal requests never trust request body branchId.
- Terminal write path rejects ONLINE_STORE scope.
- Admin write and read paths enforce RBAC.
- Branch leakage is prevented by repository scoped predicates.

## Error Mapping
- Invalid scope combination -> INVENTORY_SCOPE_INVALID
- Missing branch for BRANCH scope -> INVENTORY_BRANCH_REQUIRED
- Terminal tries forbidden scope or branch -> INVENTORY_FORBIDDEN or BRANCH_FORBIDDEN
- Duplicate idempotency key -> INVENTORY_MOVEMENT_DUPLICATE
- Storage write failure -> INVENTORY_STOCK_WRITE_FAILED
- Storage read failure -> INVENTORY_STOCK_READ_FAILED

## Observability Strategy
- Structured movement event logs include:
  - movementId
  - productId
  - scopeType
  - branchId
  - actorType
  - idempotencyKey
  - previousQuantity
  - newQuantity
- Structured sync logs include:
  - terminalId
  - branchId
  - rowCount
  - zeroQuantityCount
  - syncMode
  - errorCode

## Runtime Validation Strategy
- Verify full catalog sync includes zero-quantity products.
- Verify branch A and branch B quantities diverge correctly.
- Verify terminal movement attempts cannot mutate ONLINE_STORE scope.
- Verify duplicate movement idempotency key does not change quantity.
