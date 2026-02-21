# Design

## Objective
Specify hardening design for terminal activation and rotation while preserving current behavior and API compatibility.

## Scope
- cloud-api domain and API hardening.
- additive Prisma data model updates.
- no UI scope in this hardening extension.

## Non-Goals
- no inventory, sales sync, report, checkout, or order domain changes.
- no schema removals or contract-breaking endpoint rewrites.

## Functional Requirements
1. Fingerprint-bound activation.
2. Rotation with one grace token window for 5 minutes.
3. Revocation that blocks all terminal token usage until admin key regeneration.
4. Backward-compatible activation and rotation contracts with additive fields only.

## Data Model
Additive terminal fields:
- `deviceFingerprintHash`
- `previousDeviceTokenHash`
- `previousTokenGraceValidUntil`
- `revokedAt`
- `revokedByAdminId`

Index plan:
- index activation key hash field.
- index current device token hash field.
- index previous grace token hash field.
- optional composite index on `(status, revokedAt)` for admin audits.

Migration requirements:
- additive migration only.
- no drop or rename operations.
- nullable defaults for new fields to preserve existing rows.

## Security
- all stored secrets are hashes.
- token rotation must be atomic and race-safe.
- fingerprint mismatch responses must not leak valid fingerprint details.
- revoked terminal cannot rotate using active or grace token.
- rate-limit activation endpoint and document rotation abuse limits.

## Architecture
Explicit chain:
- Controller -> Use case -> Repository -> Prisma -> Database

Supporting chain:
- Controller -> Use case -> TokenService

Responsibilities:
- Controller:
  - parse request
  - authenticate transport layer
  - map use case errors to API envelope
- Use case:
  - enforce terminal state invariants
  - verify fingerprint rules
  - orchestrate rotation with grace window
- Repository:
  - fetch and update terminal row with transaction support
- Prisma:
  - persistence adapter
- TokenService:
  - random token generation
  - hash comparison
  - hash derivation utilities

## Error Model
Required stable codes:
- `TERMINAL_FINGERPRINT_MISMATCH`
- `TERMINAL_REVOKED`
- `TERMINAL_TOKEN_EXPIRED`
- `TERMINAL_ROTATION_FAILED`
- `TERMINAL_INVALID_GRACE_TOKEN`

Existing stable codes maintained:
- `POS_INVALID_ACTIVATION_KEY`
- `POS_TOKEN_INVALID`
- `POS_RATE_LIMITED`

## State Invariants
- if `revokedAt` is not null, status must be `REVOKED`.
- ACTIVE status requires non-revoked terminal.
- current token and previous token represent a two-token maximum window.
- previous token validity must never exceed `previousTokenGraceValidUntil`.
- fingerprint hash can only be set on first activation or reset path after revoke and regenerate.

## Performance Constraints
- token lookup operations must use indexes, not scans.
- rotation must complete with single terminal transaction and bounded writes.
- grace window check uses current server time and simple comparison.
- no background jobs required for grace expiration cleanup.

## Acceptance Criteria
- all hardening scenarios have deterministic outcomes with stable error codes.
- additive migration design is explicit and safe.
- architecture keeps business logic out of controllers.
- spec audit for this slug passes READY.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-terminal-activation-hardening-v1"`
