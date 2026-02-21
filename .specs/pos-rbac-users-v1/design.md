# Design

## Objective
Define a secure and additive RBAC architecture for ADMIN and EMPLOYEE users across cloud-api, online-store admin, and desktop POS.

## Scope
- cloud-api auth, authorization, branch scoping, and audit trail writes
- online-store admin access control and route gating for fulfillment-only employee access
- desktop POS session boot, offline session TTL policy, and permission matrix enforcement
- Prisma schema and migration updates required for roles, scoped sessions, and audit logs

## Non-Goals
- No third role introduction in v1
- No broad UX redesign
- No offline fulfillment flow
- No permission configuration UI in v1

## Actors & Roles
- ADMIN:
  - Full access to all protected domains
- EMPLOYEE:
  - Branch-scoped fulfillment and branch-scoped POS operations
- System:
  - Enforces authorization and records auditable actions

## Data Model
- Prisma enum:
  - UserRole: ADMIN, EMPLOYEE
- User fields:
  - role UserRole
  - branchId nullable
  - displayName
  - isActive
- Session fields:
  - userId
  - roleSnapshot
  - branchIdSnapshot
  - expiresAt
  - createdAt
- AuditLog fields:
  - actorUserId
  - actorRole
  - actorDisplayName
  - action
  - targetType
  - targetId
  - branchId nullable
  - createdAt
- Indexes:
  - User(role, branchId)
  - Session(userId, expiresAt)
  - AuditLog(actorUserId, createdAt)
  - AuditLog(createdAt)

## Security
- cloud-api is source of truth for role and branch permissions.
- Branch ID in employee session must be enforced on all employee operations.
- Sensitive actions must reject with stable RBAC codes.
- Passwords are hashed and never returned in API responses.
- Session tokens are never logged and are validated on each protected request.
- Online-store and desktop UI must hide forbidden actions but also rely on API denial for enforcement.

## Architecture
Required chain for all protected actions:

Controller -> Use Case -> Repository -> Storage or Prisma

- Controller:
  - Validate request shape and auth context presence.
  - Delegate business decisions.
- Use Case:
  - Resolve actor role and permission matrix.
  - Enforce branch scope and action permissions.
  - Emit audit command payload for sensitive actions.
- Repository:
  - Apply scoped query filters and perform writes.
- Storage or Prisma:
  - Persist data with transactional consistency.

## Functional Requirements
- Auth:
  - Support login flow for ADMIN and EMPLOYEE with role in session payload.
- online-store:
  - Gate routes and actions to fulfillment-only for EMPLOYEE.
  - Block reports, users, and catalog management for EMPLOYEE.
- desktop POS:
  - Gate actions by permission matrix.
  - Offline login policy:
    - Existing valid cached session within TTL may continue.
    - New login while offline is blocked.
- Branch scoping:
  - EMPLOYEE data access is restricted to assigned branch.
  - ADMIN may act across branches.
- Audit:
  - Sensitive admin actions persist actor metadata.

## Permission Matrix
- EMPLOYEE allowed:
  - fulfillment order list in assigned branch
  - fulfillment status updates in assigned branch
  - POS sales creation
  - POS inventory increment
  - POS tournament open and close
  - POS cash drawer open and close
  - POS cash cut
- EMPLOYEE forbidden:
  - reports
  - user management
  - product and catalog edits
  - price updates
  - cross-branch operations

## Error Model (Stable Codes)
- AUTH_INVALID_CREDENTIALS
- AUTH_FORBIDDEN
- AUTH_SESSION_EXPIRED
- RBAC_FORBIDDEN
- RBAC_ROLE_REQUIRED
- BRANCH_FORBIDDEN

## Observability
- Log events:
  - auth login success and failure
  - permission denied
  - branch scope denied
  - sensitive mutation audit write result
- Required fields:
  - requestId
  - actorUserId nullable
  - actorRole nullable
  - actorDisplayName nullable
  - branchId nullable
  - action
  - errorCode nullable

## Acceptance Criteria
1. EMPLOYEE online-store access is limited to fulfillment scope only.
2. EMPLOYEE POS permissions match allowlist and denylist rules.
3. cloud-api returns stable auth and RBAC error codes for all forbidden cases.
4. Sensitive actions persist required actor audit metadata.
5. Offline cached session policy behaves exactly as defined.
6. Cross-branch employee operations are rejected.
7. Migration is additive-only with no schema-breaking operations.
