## Phase 1 - Schema and migration
- Add Product.isFeatured boolean (default false).
- Add Product.featuredOrder integer (nullable).
- Create Prisma migration (additive only).

## Phase 2 - Prisma query
- Implement query for featured products using Prisma.
- Apply filter, ordering, and limit rules.
- Map inventory to availability state.

## Phase 3 - Endpoint
- Add GET /api/cloud/catalog/featured route.
- Return response shape as defined in design.
- Ensure read-only behavior and safe error responses.

## Phase 4 - Validation
- Verify ordering and limit behavior.
- Verify ordering when featuredOrder is null.
- Verify empty result handling.
- Verify availability mapping.
- Verify no sensitive fields are exposed.
- Verify auth behavior (401 without x-cloud-secret).
