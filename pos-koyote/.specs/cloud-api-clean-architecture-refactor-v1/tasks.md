# Tasks: Cloud API Clean Architecture Refactor v1

## Phase 1: Structure and scaffolding
1. Create Clean Architecture folders (presentation, application, domain, infrastructure).
2. Create app bootstrap and env config modules.
3. Add Prisma and pg helpers in infrastructure/db.
4. Create error model and helper utilities.

## Phase 2: Routes and controllers
1. Create public and protected routers in presentation/routes.
2. Implement controllers in presentation/controllers.
3. Wire routes into app.ts and index.ts.

## Phase 3: Services and validation
1. Create use cases in application/use-cases.
2. Define repository interfaces in application/ports.
3. Move business logic into use cases with domain entities.
4. Create infrastructure repositories implementing ports (Prisma/pg).
5. Create validation helpers matching existing behavior.
6. Ensure controllers map validation errors to existing responses.

## Phase 4: Parity checks
1. Verify all endpoints return same status codes and payloads.
2. Verify auth boundary unchanged (filters public, others protected).
3. Verify Prisma/pg usage unchanged.
4. Verify no Prisma imports in application/domain.
5. Verify no business logic in controllers.
