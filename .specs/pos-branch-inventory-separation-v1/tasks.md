# pos-branch-inventory-separation-v1 - Tasks

## Phase 1 - Contract and Current Code Audit
- [ ] Identify all POS sync reads that still use global inventory totals.
- [ ] Identify any product filtering logic that excludes quantity == 0 products.
- [ ] Map current terminal-auth branch derivation and verify branch guard path coverage.
- [ ] Identify existing admin inventory write paths and scope assumptions.

## Phase 2 - Prisma Schema and Migration (Additive)
- [ ] Add inventory_stock model with scoped unique constraint.
- [ ] Add inventory_movement model with unique idempotencyKey.
- [ ] Add required indexes for branch and product read paths.
- [ ] Keep legacy read_model_inventory.available for compatibility.
- [ ] Provide migration and rollback notes.

## Phase 3 - Cloud Endpoints, Branch Isolation, Idempotency
- [ ] Implement POST /pos/inventory/movements with terminal branch guard.
- [ ] Implement POST /admin/inventory/movements with scope validation.
- [ ] Implement GET /admin/inventory/stock with RBAC and pagination.
- [ ] Enforce branchId derivation from terminal auth for terminal paths.
- [ ] Enforce idempotency duplicate no-op behavior.
- [ ] Return stable inventory error codes only.

## Phase 4 - POS Local Queue Integration for Inventory Movements
- [ ] Add movement queue event type for inventory adjustments.
- [ ] Persist movement payload plus idempotencyKey locally when offline.
- [ ] Retry queued movement writes in background.
- [ ] Mark queue records complete only after confirmed cloud write.

## Phase 5 - Sync Payload Update for Full Catalog with Branch Quantity
- [ ] Ensure snapshot returns all catalog rows regardless of quantity.
- [ ] Ensure delta does not omit products due to quantity filters.
- [ ] Add branchQuantity via left join with default 0.
- [ ] Preserve enabledPOS and enabledOnlineStore payload flags.

## Phase 6 - Minimal POS UI Flow to Add Inventory
- [ ] Add minimal inventory adjustment action in POS workflow.
- [ ] Restrict POS scope selection to terminal branch only.
- [ ] Validate delta entry and reason before enqueue or submit.
- [ ] Surface stable error messages for forbidden scope and negative guard failures.

## Phase 7 - Runtime Checklist, Gates, and Governance Audit
- [ ] Validate branch A and branch B diverging quantities for same product.
- [ ] Validate POS cannot mutate ONLINE_STORE scope.
- [ ] Validate offline queued movement replay applies once with idempotency.
- [ ] Run builds:
  - [ ] npm run build -w apps/cloud-api
  - [ ] npm run build -w apps/desktop
  - [ ] npm run build -w apps/online-store
  - [ ] npm run build -w apps/web
- [ ] Run implementation audit:
  - [ ] npm run gov:impl:audit -- "pos-branch-inventory-separation-v1"

## Guard Searches
- [ ] Detect legacy global inventory usage in POS sync paths:
  - [ ] rg -n "read_model_inventory\.available|available" apps/cloud-api/src apps/desktop -S
- [ ] Detect quantity-based filtering in sync services and projection:
  - [ ] rg -n "quantity\s*>\s*0|available\s*>\s*0|where:.*available" apps/cloud-api/src apps/desktop packages -S
- [ ] Detect missing branch predicates on scoped inventory queries:
  - [ ] rg -n "inventory_stock|BranchCatalogScope|branchId" apps/cloud-api/src -S

## Spec Audit Command
- [ ] npm run gov:spec:audit -- "pos-branch-inventory-separation-v1"
