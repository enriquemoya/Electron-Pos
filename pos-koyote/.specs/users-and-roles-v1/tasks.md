# Tasks: Users and Roles v1

## Phase 1: Schema and migrations
1. Add Prisma User model and enums.
2. Add Address model and relations.
3. Create migration and generate client.

## Phase 2: Admin API
1. Add admin user routes/controllers/services.
2. Implement validation helpers for user payloads.
3. Protect routes with existing secret middleware.
4. Add admin address CRUD routes for users.
5. Add pagination for user list endpoint.

## Phase 3: Optional admin UI
1. Add admin pages only if required for management.
2. Localize all admin UI strings.

## Phase 4: Parity checks
1. Verify existing endpoints unchanged.
2. Verify no public API exposes user PII.
3. Verify admin endpoints enforce validation and auth boundary.
