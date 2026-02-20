# Tasks

## Objective
Deliver `pos-rbac-users-v1` with additive schema and strict server-side RBAC enforcement across cloud-api, online-store, and desktop POS.

## Scope
- apps/cloud-api
- apps/online-store
- apps/desktop
- Prisma schema and migration

## Non-Goals
- No role hierarchy expansion
- No checkout redesign
- No offline fulfillment

## Actors & Roles
- ADMIN
- EMPLOYEE

## Functional Requirements
- Implement role-aware authentication sessions.
- Enforce branch-scoped employee access.
- Enforce online-store fulfillment-only employee permissions.
- Enforce POS employee permission matrix.
- Persist audit metadata on sensitive actions.

## Data Model
Phase deliverables:
- Add UserRole enum and user role fields.
- Add or extend session model with role and branch snapshots.
- Add AuditLog model or additive extension for actor metadata.
- Add indexes documented in design.

## Security
Phase checks:
- Server-side role guard on sensitive cloud-api endpoints.
- Branch scope guard for employee requests.
- Session and token safe handling.
- No reliance on client-only role gating.

## Architecture
Required implementation chain:
- Controller -> Use Case -> Repository -> Storage or Prisma

Phase design checkpoints:
- No business logic in controllers.
- Use cases contain permission decisions.
- Repositories contain scoped query logic only.

## Error Model (Stable Codes)
- AUTH_INVALID_CREDENTIALS
- AUTH_FORBIDDEN
- AUTH_SESSION_EXPIRED
- RBAC_FORBIDDEN
- RBAC_ROLE_REQUIRED
- BRANCH_FORBIDDEN

## Observability
Implementation checkpoints:
- Add structured logs for auth and RBAC denials.
- Add audit trail write checks for sensitive actions.
- Verify metrics counters are emitted for auth and RBAC events.

## Acceptance Criteria
1. EMPLOYEE can only perform fulfillment actions in online-store for assigned branch.
2. EMPLOYEE cannot access reports, users, product or pricing management.
3. EMPLOYEE POS permissions are enforced exactly as specified.
4. Sensitive mutations persist actorUserId, actorRole, actorDisplayName, timestamp.
5. Offline POS auth allows cached session continuation within TTL.
6. Offline POS auth blocks new login attempts.
7. cloud-api returns only stable error codes for auth and RBAC failures.
8. Branch scope violations return BRANCH_FORBIDDEN.
9. Prisma migration is additive-only and passes generation.

## Implementation Phases
1. Phase 1: Data foundation
   - Add role enum and user, session, audit schema updates.
   - Generate and review additive migration.
2. Phase 2: cloud-api authorization core
   - Implement role and branch middleware or guards.
   - Apply policy checks to fulfillment and admin endpoints.
   - Apply stable error mappings.
3. Phase 3: online-store gating
   - Gate route access and menu visibility by role.
   - Restrict employee surfaces to fulfillment views and actions only.
4. Phase 4: desktop POS gating
   - Enforce permission matrix in POS actions.
   - Implement offline cached session TTL behavior.
5. Phase 5: observability and audit
   - Persist audit metadata for sensitive actions.
   - Validate structured logs and metrics.
6. Phase 6: validation gates
   - Run build and governance audits.

## Validation Commands
- `npm run prisma:generate -w apps/cloud-api`
- `npm run build -w apps/cloud-api`
- `npm run build -w apps/online-store`
- `npm run build -w apps/desktop`
- `npm run gov:spec:audit -- "pos-rbac-users-v1"`
- `npm run gov:impl:audit -- "pos-rbac-users-v1"`

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-rbac-users-v1"`
