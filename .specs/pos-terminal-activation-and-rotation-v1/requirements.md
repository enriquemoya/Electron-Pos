# Requirements

## Objective
Replace deprecated Google Drive based POS sync with a secure terminal activation and token rotation system across cloud-api, desktop POS, and online-store admin UI.

## Scope
- cloud-api: terminal management endpoints, activation endpoint, rotation endpoint, revocation endpoint behavior, stable error model, security controls.
- apps/desktop: activation screen, local credential persistence, startup rotation, offline fallback behavior.
- apps/online-store: admin UI for terminal CRUD-like actions at locale-aware route `/{locale}/admin/pos/terminals`.
- data: additive Prisma schema and migration for terminal records and token state.

## Non-Goals
- No inventory logic changes.
- No sales sync implementation.
- No reporting changes.
- No Google Drive usage or compatibility layer.
- No schema removals or breaking migrations.
- No changes to checkout or existing order flows.

## Constraints
- Additive-only schema and API changes.
- Existing endpoint request and response shapes must remain backward compatible.
- No shared secrets in online-store client components.
- POS renderer does not access remote DB directly.
- Governance docs and spec content must stay ASCII-only and English-only.

## Functional Requirements

### 1) Admin Terminal Management
- Admin page path: `/{locale}/admin/pos/terminals`.
- Admin can create terminal with:
  - `name`
  - `branchId`
  - auto-generated one-time `activationApiKey` shown at creation time.
- Admin can revoke terminal.
- Admin can regenerate activation key (invalidates previous activation key).
- Admin can view terminal status: `PENDING`, `ACTIVE`, `REVOKED`.

### 2) Activation Flow (Desktop POS)
- POS starts at activation screen when:
  - no local device token exists, or
  - stored token is invalid/revoked.
- Activation request:
  - `POST /pos/activate`
  - body: `{ activationApiKey: string }`
- Activation response:
  - `{ terminalId: string, branchId: string, deviceToken: string }`
- POS stores `terminalId`, `branchId`, and `deviceToken` in secure local storage.

### 3) Token Rotation on Startup
- On each POS startup:
  - `POST /pos/token/rotate`
  - `Authorization: Bearer <deviceToken>`
- Success:
  - returns `{ deviceToken: string }`
  - POS replaces local token atomically.
- Network failure:
  - POS continues using existing local token.
- Invalid token or revoked terminal:
  - POS clears local terminal credentials.
  - POS returns to activation screen.

### 4) Revocation Behavior
- Admin revocation marks terminal as `REVOKED`.
- Revocation invalidates current device token server-side.
- POS detects invalid token on next rotation call and returns to activation flow.

### 5) Offline Rules
- If rotation endpoint is unreachable and local token exists, POS may continue offline.
- Offline mode must not block startup due only to connectivity failure.

## Data Model
Add additive Prisma model `Terminal` and related enums.

Terminal fields:
- `id` UUID primary key
- `name` string
- `branchId` UUID foreign key
- `activationApiKeyHash` string
- `currentDeviceTokenHash` string nullable
- `status` enum: `PENDING | ACTIVE | REVOKED`
- `createdAt` datetime
- `updatedAt` datetime
- `revokedAt` datetime nullable

Constraints:
- No modification of existing table semantics.
- No field removals.
- Migration must be additive-only.

## Security
- Activation API keys are stored hashed only.
- Device tokens are stored hashed only.
- Tokens must be high entropy random values from cryptographic RNG.
- Rotation invalidates previous token in one atomic transaction.
- No `console.log` in production paths.
- Activation endpoint must be rate-limited.
- Rotation endpoint should have abuse protection (rate limit or throttling).
- Terminal admin endpoints require existing admin auth middleware.

## Error Model
All errors must use stable codes and the existing API error envelope.

Required codes:
- `POS_INVALID_ACTIVATION_KEY`
- `POS_TERMINAL_REVOKED`
- `POS_TOKEN_INVALID`
- `POS_RATE_LIMITED`
- `POS_TERMINAL_NOT_FOUND`
- `POS_TERMINAL_ALREADY_REVOKED`

## i18n
- Admin terminal UI labels must be localized in `es-MX` and `en-US`.
- Desktop activation screen copy must support existing POS locale strategy.
- No hardcoded user-facing strings in components.

## Error Handling
- Activation with invalid or expired key returns `POS_INVALID_ACTIVATION_KEY` and does not expose key existence details.
- Rotation with invalid token returns `POS_TOKEN_INVALID` and must trigger local credential clear on desktop.
- Rotation for revoked terminal returns `POS_TERMINAL_REVOKED`.
- Rate limit responses return `POS_RATE_LIMITED`.
- Connectivity or timeout failures in desktop rotation are treated as offline fallback, not fatal startup errors.

## Acceptance Criteria
1. Admin can create a terminal and receive one activation key display event.
2. Desktop activation succeeds with valid key and stores `terminalId`, `branchId`, and `deviceToken` locally.
3. Startup rotation returns a new token and invalidates old token.
4. Revoked terminal is forced back to activation on next rotation attempt.
5. Offline startup works when rotation endpoint is unreachable and local token exists.
6. Prisma migration is additive-only and does not break existing data.
7. Builds pass:
   - `npm run build -w apps/cloud-api`
   - `npm run build -w apps/online-store`
   - `npm run build -w apps/desktop`
