# Tasks: Cloud API Clean Architecture Refactor v1

## Phase 1: Structure and scaffolding
1. Create app bootstrap and env config modules.
2. Add Prisma and pg helpers in db/.
3. Create error model and helper utilities.

## Phase 2: Routes and controllers
1. Create public and protected routers.
2. Implement controllers for each endpoint.
3. Wire routes into app.ts and index.ts.

## Phase 3: Services and validation
1. Move existing business logic into services.
2. Create validation helpers matching existing behavior.
3. Ensure controllers map validation errors to existing responses.

## Phase 4: Parity checks
1. Verify all endpoints return same status codes and payloads.
2. Verify auth boundary unchanged (filters public, others protected).
3. Verify Prisma/pg usage unchanged.
