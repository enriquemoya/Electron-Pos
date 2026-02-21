# pos-rbac-users-v1

## Objective
Introduce RBAC user accounts for cloud-api, online-store admin, and desktop POS with ADMIN and EMPLOYEE roles, with server-side authorization enforcement and branch-scoped permissions.

## Scope
- apps/cloud-api authentication and RBAC enforcement
- apps/online-store route and action gating for admin surfaces
- apps/desktop POS login and permission gating
- data layer updates in Prisma, additive-only

## Non-Goals
- No checkout flow redesign beyond permission gating
- No role hierarchy beyond ADMIN and EMPLOYEE in v1
- No offline fulfillment in v1
- No changes to payment engine behavior

## Actors & Roles
- ADMIN:
  - Full access in online-store admin and cloud-api admin actions
  - Full POS administrative access
- EMPLOYEE:
  - Online-store access only for fulfillment workflow
  - POS access only for explicitly allowed operations
- Terminal:
  - Device identity for POS authentication context
- Branch:
  - Scope boundary for employee access and data visibility

## Functional Requirements
1. Account and role model:
   - Users authenticate with email and password.
   - Every user has exactly one primary role: ADMIN or EMPLOYEE.
   - EMPLOYEE users must be assigned to one branch.
2. Online-store fulfillment permissions for EMPLOYEE:
   - Can view orders requiring fulfillment in assigned branch.
   - Can update fulfillment statuses only (packed, shipped, or mapped equivalents).
   - Cannot access reports, user management, product and catalog editing, pricing updates.
3. POS permissions for EMPLOYEE:
   - Allowed: create sales, inventory increment only, open and close tournaments, cash drawer open and close, cash cut.
   - Forbidden: catalog creation or editing, product and price modification, financial reports, user management.
4. Server-side RBAC:
   - cloud-api must enforce authorization on all sensitive endpoints.
   - UI gating in online-store and desktop is secondary and cannot replace API checks.
5. Audit metadata:
   - Sensitive admin mutations must persist actorUserId, actorRole, actorDisplayName, and timestamp.
6. Offline policy for POS employee auth:
   - Cached authenticated session with TTL is allowed for offline continuation.
   - New login is not allowed while offline.
   - If cache is expired and network is unavailable, POS must block login and show offline auth required state.
7. Branch scoping:
   - EMPLOYEE requests are scoped to assigned branch.
   - Cross-branch reads and writes are forbidden.

## Data Model
- Additive Prisma changes only. No destructive edits.
- Required entities and fields:
  - User:
    - role enum: ADMIN, EMPLOYEE
    - branchId nullable for ADMIN, required for EMPLOYEE
    - displayName
    - isActive
  - Session:
    - userId
    - role snapshot
    - branchId snapshot
    - expiresAt
  - AuditLog (or equivalent additive table):
    - actorUserId
    - actorRole
    - actorDisplayName
    - action
    - targetType
    - targetId
    - branchId nullable
    - createdAt
- Required indexes:
  - User(role, branchId)
  - Session(userId, expiresAt)
  - AuditLog(createdAt)
  - AuditLog(actorUserId, createdAt)

## Security
- Authentication and RBAC checks must happen in cloud-api middleware or use case layer.
- Branch scoping must be applied server-side on every employee query and mutation.
- Desktop and online-store must not trust client role flags without server validation.
- Session tokens must be protected and never logged.
- Passwords must be hashed using approved one-way hashing.
- Account lock or throttling strategy must be documented for repeated auth failures.

## Architecture
- Required chain:
  - Controller -> Use Case -> Repository -> Storage or Prisma
- Controllers:
  - Parse request, invoke use case, return response.
- Use cases:
  - Enforce role and branch authorization rules.
  - Enforce action-level permission matrix.
- Repositories:
  - Execute scoped reads and writes only.
- Storage or Prisma:
  - Persist user, session, and audit records.

## Error Model (Stable Codes)
- AUTH_INVALID_CREDENTIALS
- AUTH_FORBIDDEN
- AUTH_SESSION_EXPIRED
- RBAC_FORBIDDEN
- RBAC_ROLE_REQUIRED
- BRANCH_FORBIDDEN

## Observability
- Structured logs for auth and RBAC failures with:
  - userId nullable
  - role nullable
  - branchId nullable
  - endpoint
  - errorCode
  - requestId
- Metrics:
  - auth_login_success_total
  - auth_login_failed_total
  - rbac_forbidden_total
  - branch_forbidden_total

## Acceptance Criteria
1. ADMIN can access all defined admin and POS capabilities.
2. EMPLOYEE can only access fulfillment in online-store admin, scoped to assigned branch.
3. EMPLOYEE can execute only allowed POS actions; forbidden actions return stable RBAC errors.
4. Every sensitive admin mutation stores required audit metadata.
5. Offline POS behavior:
   - Existing valid cached session works within TTL.
   - New offline login is denied.
6. Branch scoping prevents cross-branch access for EMPLOYEE users.
7. Prisma migration is additive-only and build-safe.
8. Spec audit command is documented and runnable.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-rbac-users-v1"`
