# Tasks

## Objective
Deliver terminal activation and rotation with secure token lifecycle and admin terminal management, without breaking existing systems.

## Scope
- cloud-api
- apps/desktop
- apps/online-store admin
- Prisma additive schema migration

## Non-Goals
- No inventory, reports, checkout, or order flow changes.
- No Google Drive integration.
- No destructive schema operations.

## Functional Requirements
- Admin can create, revoke, regenerate activation key, and list terminals.
- Desktop can activate with activation key and persist credentials.
- Desktop rotates token at startup with offline fallback.
- Revoked terminal is forced back to activation.

## Data Model
- Add `TerminalStatus` enum and `Terminal` model (additive-only).
- Add indexes and branch relation.
- No mutation of existing models beyond additive relation references if needed.

## Security
- Hash activation key and device token.
- Use cryptographic random generation.
- Enforce admin auth on admin routes.
- Enforce rate limits on activation (and rotation if policy requires).
- Keep production runtime free of console logging.

## Architecture
- Implement explicit layers:
  - controllers
  - use cases
  - repository
  - token service
- Keep token business logic in token service and use cases.

## Error Model
- Implement stable codes:
  - `POS_INVALID_ACTIVATION_KEY`
  - `POS_TERMINAL_REVOKED`
  - `POS_TOKEN_INVALID`
  - `POS_RATE_LIMITED`
  - `POS_TERMINAL_NOT_FOUND`
  - `POS_TERMINAL_ALREADY_REVOKED`

## Acceptance Criteria
- Terminal management UI exists at `/{locale}/admin/pos/terminals`.
- Activation and rotation endpoints behave as specified.
- Revocation and invalid token handling redirect desktop to activation.
- Offline fallback keeps POS startup functional.
- Additive migration applied with no breakage.
- Builds pass for all in-scope apps.

## Phase 1 - Spec Validation
1. Create requirements, design, and tasks for `pos-terminal-activation-and-rotation-v1`.
2. Ensure ASCII-only and English-only content.
3. Run strict spec audit and resolve blockers.

## Phase 2 - Data Layer
1. Add Prisma enum `TerminalStatus`.
2. Add Prisma model `Terminal` with indexes and branch relation.
3. Generate additive migration and Prisma client.

## Phase 3 - Cloud API
1. Implement terminal repository and use cases.
2. Implement admin terminal management endpoints.
3. Implement activation endpoint with key validation.
4. Implement rotation endpoint with atomic token replacement.
5. Add rate limiting and stable error mapping.

## Phase 4 - Desktop POS
1. Add activation screen and submission flow.
2. Persist terminal credentials securely.
3. Add startup rotation handler.
4. Add offline fallback and invalid token credential clear flow.

## Phase 5 - Online Store Admin UI
1. Add terminals admin route and page.
2. Add terminal list table with status and branch labels.
3. Add create, revoke, and regenerate key actions.
4. Add localized copy for all user-visible labels.

## Phase 6 - Verification
1. Run build checks:
   - `npm run build -w apps/cloud-api`
   - `npm run build -w apps/online-store`
   - `npm run build -w apps/desktop`
2. Run governance checks:
   - `npm run gov:spec:audit -- "pos-terminal-activation-and-rotation-v1"`
   - implementation audit command after development.
3. Manual simulation:
   - activate with valid key
   - rotate on startup
   - revoke terminal and confirm activation fallback
   - offline rotation failure fallback
