# Design

## Objective
Define a secure terminal activation architecture that replaces Google Drive sync with admin-managed terminal identities and rotating device tokens.

## Scope
- Backend API and domain logic in cloud-api.
- Desktop activation and startup token lifecycle in Electron POS.
- Admin UI for terminal management in online-store.
- Additive Prisma data model only.

## Non-Goals
- No inventory domain behavior updates.
- No sales synchronization implementation.
- No reporting workflow changes.
- No checkout or order flow changes.

## Architecture

### Layering
- Controller -> Use Case -> Repository -> Prisma
- Controller -> Use Case -> TokenService

Rules:
- Controllers only parse request, call use case, and return response.
- Use cases enforce terminal lifecycle rules and orchestration.
- Repositories encapsulate DB reads/writes.
- TokenService encapsulates random token generation, hashing, compare, and rotation primitives.

### Components by Module
- cloud-api:
  - `pos-terminal-controller`
  - `pos-terminal-use-cases`
  - `pos-terminal-repository`
  - `token-service`
- apps/desktop:
  - activation view
  - secure local credential store
  - startup bootstrap rotation handler
- apps/online-store:
  - admin terminals page
  - terminal table and actions UI

## Functional Requirements Mapping

### Admin Terminal Management
- Create terminal use case:
  - validate branch exists
  - generate activation key
  - store hashed activation key
  - set status `PENDING`
- Revoke terminal use case:
  - set status `REVOKED`
  - set `revokedAt`
  - clear active device token hash
- Regenerate activation key use case:
  - allowed for `PENDING` and `ACTIVE`
  - rotate activation key hash
  - return plaintext key only once in response

### Activation Flow
- `POST /pos/activate`:
  - validate activation key hash match
  - reject revoked terminal
  - generate device token
  - hash and persist token hash
  - promote status from `PENDING` to `ACTIVE` when first activated

### Rotation Flow
- `POST /pos/token/rotate`:
  - validate bearer token against stored hash
  - reject revoked terminal
  - generate new token
  - update hash atomically in transaction
  - return new token

### Offline Desktop Behavior
- Desktop startup steps:
  1. read local credentials
  2. if no token -> activation screen
  3. if token exists -> call rotate endpoint
  4. if rotate success -> replace local token
  5. if rotate network failure -> continue with old token and mark offline mode
  6. if rotate invalid/revoked -> clear local credentials and show activation

## Data Model

### Prisma Types
- `TerminalStatus` enum:
  - `PENDING`
  - `ACTIVE`
  - `REVOKED`

- `Terminal` model:
  - `id String @id @default(uuid())`
  - `name String`
  - `branchId String`
  - `activationApiKeyHash String`
  - `currentDeviceTokenHash String?`
  - `status TerminalStatus @default(PENDING)`
  - `createdAt DateTime @default(now())`
  - `updatedAt DateTime @updatedAt`
  - `revokedAt DateTime?`

### Indexes and Constraints
- unique index on `(name, branchId)` recommended to avoid duplicate labels per branch.
- index on `status` for admin listing and filtering.
- foreign key to branches table via `branchId`.

### Migration Strategy
- single additive migration creating enum and model.
- no data backfill required.
- no destructive SQL.

## Security
- Hashing:
  - activation keys and device tokens hashed server-side using existing secure hashing strategy.
- Key/token generation:
  - cryptographic RNG, minimum 32 random bytes before encoding.
- API hardening:
  - activation endpoint rate limit required.
  - auth guard required for admin terminal routes.
- Sensitive output:
  - activation key plaintext never stored, only shown immediately after create/regenerate.
  - device token plaintext returned only to authenticated terminal activation and rotation responses.

## Error Model
- `POS_INVALID_ACTIVATION_KEY`: activation key missing or mismatch.
- `POS_TERMINAL_REVOKED`: terminal is revoked.
- `POS_TOKEN_INVALID`: bearer token invalid or missing.
- `POS_RATE_LIMITED`: rate limit exceeded.
- `POS_TERMINAL_NOT_FOUND`: terminal ID does not exist for admin operations.
- `POS_TERMINAL_ALREADY_REVOKED`: revoke action called for already revoked terminal.

## API Contracts

### Admin (authenticated)
- `GET /admin/pos/terminals`
- `POST /admin/pos/terminals`
- `POST /admin/pos/terminals/:id/revoke`
- `POST /admin/pos/terminals/:id/regenerate-key`

### POS Terminal
- `POST /pos/activate`
- `POST /pos/token/rotate`

Response bodies are additive and do not alter existing contracts.

## Edge Cases
- Activation key reuse after regeneration must fail.
- Concurrent rotation requests for same token:
  - first succeeds
  - second fails with `POS_TOKEN_INVALID`.
- Revoked terminal with cached desktop token:
  - next rotation rejects and clears local credentials.
- Temporary network outage at startup:
  - desktop continues offline with existing token.
- Branch deletion attempts for branch with assigned terminals should be rejected or constrained by existing FK rules.

## Acceptance Criteria
- Architecture layering is respected with no business logic in controllers.
- Terminal lifecycle behavior is deterministic across create, activate, rotate, revoke.
- Offline fallback behavior is documented and testable.
- Stable error codes are used consistently in backend and desktop handlers.
- Build commands pass for cloud-api, online-store, and desktop.
