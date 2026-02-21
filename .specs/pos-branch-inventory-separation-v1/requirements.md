# pos-branch-inventory-separation-v1 - Requirements

## Objective
Refactor inventory source-of-truth so stock is separated by scope and branch isolation is enforced end-to-end.

Target behavior:
- ONLINE_STORE stock is separate from BRANCH stock.
- POS manages only BRANCH stock for the terminal branch.
- POS catalog sync returns full catalog even when stock is 0.

## Scope
- apps/cloud-api:
  - Add additive inventory stock and movement model.
  - Add or adjust terminal-auth and admin endpoints for scoped stock reads and writes.
  - Keep sync contracts additive and backward compatible.
- apps/desktop:
  - Consume branch-scoped quantities from sync payload.
  - Queue offline inventory movements and retry with idempotency.
  - Keep POS inventory actions restricted to terminal branch scope.
- data:
  - Additive Prisma schema and migration updates only.
- apps/online-store:
  - Minimal consume-only updates if needed for admin scope selection.

## Non-Goals
- No redesign of POS flows beyond minimal add inventory workflow.
- No breaking changes to sales or order sync contracts.
- No removal of legacy read_model tables in this slug.
- No multi-warehouse optimization.

## Actors & Roles
- Terminal:
  - Authenticated via terminal token.
  - Bound to one branchId.
  - Can create BRANCH inventory movements only for its branch.
- Admin:
  - Can create inventory movements for ONLINE_STORE and any BRANCH.
  - Can query scoped inventory views with RBAC.
- Employee (optional permission path):
  - If allowed, can operate only within explicit branch permissions.

## Functional Requirements
### Inventory Model Parity
- Stock is represented by unique scope key:
  - (productId, scopeType, branchId)
- scopeType values:
  - ONLINE_STORE
  - BRANCH
- branchId rules:
  - Required when scopeType is BRANCH.
  - Null when scopeType is ONLINE_STORE.
- Missing stock row defaults to quantity 0.

### POS Sync Rules
- Snapshot and delta return full catalog for POS branch scope.
- Product rows must never be omitted due to quantity == 0.
- Branch quantity is resolved with LEFT JOIN semantics and default 0.
- Payload remains branch-scoped and must not expose global totals.
- Existing taxonomy parity flags remain present:
  - enabledPOS
  - enabledOnlineStore
- Existing sync idempotency and version guards remain unchanged.

### Inventory Adjustments
- POS branch adjustments:
  - Terminal-auth endpoint creates BRANCH movement for terminal branch only.
  - Increment required.
  - Decrement optional; if enabled, non-negative guard required unless explicitly overridden by policy.
- Admin adjustments:
  - Admin endpoint supports ONLINE_STORE and BRANCH scopes.
  - branchId is mandatory for BRANCH writes.
- Every adjustment writes one movement audit record with:
  - actorType (ADMIN, EMPLOYEE, TERMINAL)
  - actor id reference
  - reason
  - delta
  - previousQuantity
  - newQuantity
  - createdAt

### Offline Behavior
- POS inventory movement writes can run offline.
- Offline movement is persisted in local queue with idempotency key.
- Retry worker submits pending movements in background.
- Duplicate idempotency key is a no-op response.
- POS must not reconcile stock using destructive overwrite.

### Data Integrity and Branch Isolation
- Terminal endpoints derive branchId from terminal auth context.
- Cross-branch access is forbidden for terminal actions.
- Admin endpoints enforce RBAC before scope writes.
- Product FK and scoped unique constraints prevent duplicate stock rows.

### Reporting and Backups
- Movement records are reporting and backup inputs.
- Existing reporting pipeline behavior remains unchanged in this slug.

### API Contract Constraints
Additive endpoint contract surface:
- Terminal-auth:
  - POST /pos/inventory/movements
  - GET /pos/catalog/snapshot
  - GET /pos/catalog/delta
- Admin RBAC:
  - POST /admin/inventory/movements
  - GET /admin/inventory/stock

Contract notes:
- Terminal branch is derived server-side, never trusted from request body.
- Snapshot or delta must include branchQuantity per product, including quantity 0 rows.

## Data Model
### Additive Prisma Models
- inventory_stock:
  - id
  - productId (FK)
  - scopeType enum (ONLINE_STORE, BRANCH)
  - branchId nullable FK
  - quantity int
  - updatedAt
  - unique(productId, scopeType, branchId)
  - index(scopeType, branchId)
  - index(productId)
- inventory_movement:
  - id
  - productId
  - scopeType
  - branchId nullable
  - delta int
  - reason
  - actorType (ADMIN, EMPLOYEE, TERMINAL)
  - actorUserId nullable
  - actorTerminalId nullable
  - idempotencyKey unique
  - previousQuantity
  - newQuantity
  - createdAt
  - index(branchId, createdAt desc)
  - index(productId, createdAt desc)

### Legacy Read Model Handling
- read_model_inventory.available remains legacy transitional read-model field.
- POS stock source-of-truth moves to inventory_stock scope rows.
- If online-store still consumes read_model_inventory.available, keep compatibility while migrations roll out.

## Security
- Terminal-auth required for all POS inventory movement and catalog sync endpoints.
- Admin endpoints require RBAC and stable forbidden responses.
- Terminal requests must never mutate ONLINE_STORE scope.
- No renderer-side secrets.
- Rate limiting required for movement write endpoints and sync endpoints.
- Branch isolation is mandatory for all terminal scoped reads and writes.

## Architecture
- Cloud API chain:
  - Controller -> Use Case -> Repository -> Storage
- POS chain:
  - IPC Controller -> Use Case -> Repository -> Storage
- Inventory movement write path:
  - Controller validates scope semantics.
  - Use case resolves actor and branch guard.
  - Repository executes transactional stock update + movement append.
- Sync read path:
  - Use case resolves terminal branch.
  - Repository returns full catalog rows with branchQuantity from scoped stock left join.

## Error Model
Stable additive codes:
- INVENTORY_SCOPE_INVALID
- INVENTORY_BRANCH_REQUIRED
- INVENTORY_FORBIDDEN
- INVENTORY_NEGATIVE_NOT_ALLOWED
- INVENTORY_MOVEMENT_DUPLICATE
- INVENTORY_STOCK_WRITE_FAILED
- INVENTORY_STOCK_READ_FAILED
- BRANCH_FORBIDDEN
- POS_SYNC_STORAGE_FAILED
- POS_CATALOG_SNAPSHOT_FAILED
- POS_CATALOG_DELTA_FAILED

Rules:
- Existing stable codes are preserved.
- No ad-hoc string-only error responses.

## Observability
Structured logs required for inventory movement and scoped sync operations.

Required log fields:
- branchId
- terminalId
- scopeType
- productId
- movementId
- idempotencyKey
- errorCode

Required counters:
- inventory_movement_write_count
- inventory_movement_duplicate_count
- inventory_movement_retry_count
- pos_catalog_full_rows_returned
- pos_catalog_zero_quantity_rows_returned

## Acceptance Criteria
1. POS snapshot and delta return products even when branchQuantity is 0.
2. Two branches show different quantities for the same product after independent movements.
3. POS cannot modify ONLINE_STORE scope and receives stable forbidden code.
4. Admin can modify ONLINE_STORE and BRANCH scopes and changes sync to POS.
5. Every movement writes audit fields with previous and new quantity.
6. Offline movement is queued and later applied once with idempotency.
7. Build gates pass after implementation:
   - npm run build -w apps/cloud-api
   - npm run build -w apps/desktop
   - npm run build -w apps/online-store
   - npm run build -w apps/web
8. Future implementation audit command is defined:
   - npm run gov:impl:audit -- "pos-branch-inventory-separation-v1"

## Spec Audit Command
npm run gov:spec:audit -- "pos-branch-inventory-separation-v1"
