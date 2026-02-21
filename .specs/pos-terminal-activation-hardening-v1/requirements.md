# Requirements

## Objective
Harden the existing POS terminal activation and token rotation system to prevent terminal cloning, token race conditions, silent reactivation after revocation, and rotation desynchronization edge cases.

## Scope
- cloud-api hardening for activation, rotation, revocation, and error handling.
- data hardening through additive Prisma fields and indexes only.
- no desktop UI or online-store UI changes in this spec.

## Non-Goals
- no inventory logic changes.
- no sales synchronization behavior.
- no report logic changes.
- no Google Drive fallback or compatibility behavior.
- no schema removal, rename, or breaking column changes.
- no checkout or order flow changes.

## Functional Requirements
1. Device fingerprint binding
- activation flow must include `deviceFingerprint` in request.
- fingerprint is generated locally from machine identifier, OS platform, and install UUID, then SHA-256 hashed before transmission if transport policy requires hashed payload.
- backend stores fingerprint hash in terminal record on first successful activation.
- terminal activation from different fingerprint must fail with `TERMINAL_FINGERPRINT_MISMATCH`.
- fingerprint is immutable unless terminal is revoked and explicitly reactivated with regenerated activation key.

2. Token rotation grace window
- each rotation issues a new device token.
- previous token hash is stored as grace token with `previousTokenGraceValidUntil = now + 5 minutes`.
- only one grace token is allowed at a time.
- grace token is valid only until grace expiry.
- if client crashes after receiving new token but before persisting it, previous token remains valid during grace window.
- if neither active token nor grace token is valid, terminal must re-activate.

3. Revocation hardening
- revoke operation must set status to `REVOKED`.
- revoke operation must clear current token hash and grace token hash state.
- activation key remains stored but marked unusable until admin regenerates activation key.
- revoked terminal requests to activation or rotation protected endpoints must return `TERMINAL_REVOKED`.

4. Existing flow compatibility
- activation and rotation endpoint contracts remain backward compatible except additive fields.
- existing successful activation and rotation behavior remains unchanged for valid terminals.

## Data Model
Additive-only fields on terminal entity:
- `deviceFingerprintHash` string nullable
- `previousDeviceTokenHash` string nullable
- `previousTokenGraceValidUntil` datetime nullable
- `revokedAt` datetime nullable
- `revokedByAdminId` uuid nullable

Constraints:
- no field removal.
- no field rename.
- no destructive migration.
- migration must be additive and reversible-safe according to project standard.

## Security
- activation key and all device tokens are stored hashed only.
- token generation uses cryptographic random bytes with high entropy.
- fingerprint binding must be enforced server-side only.
- revoked terminals cannot silently re-enter active state.
- activation endpoint must be rate-limited.
- token rotation endpoint must reject invalid and expired grace tokens deterministically.
- no production console logging in runtime paths.

## Architecture
Layering chain is mandatory:
- Controller -> Use case -> Repository -> Prisma -> Database

Rules:
- controllers handle transport only.
- use cases enforce fingerprint, grace window, and revocation invariants.
- repositories execute persistence operations.
- hashing and token lifecycle logic executes in use case with token utility dependencies, never in controllers.

## Error Model
Stable required codes:
- `TERMINAL_FINGERPRINT_MISMATCH`
- `TERMINAL_REVOKED`
- `TERMINAL_TOKEN_EXPIRED`
- `TERMINAL_ROTATION_FAILED`
- `TERMINAL_INVALID_GRACE_TOKEN`

Compatibility codes retained from prior spec where applicable:
- `POS_INVALID_ACTIVATION_KEY`
- `POS_TOKEN_INVALID`
- `POS_RATE_LIMITED`

Rule:
- no generic error responses without a stable code.

## State Invariants
- terminal cannot be ACTIVE when `revokedAt` is not null.
- terminal has at most one active token hash and one grace token hash.
- grace token is valid only before `previousTokenGraceValidUntil`.
- fingerprint hash is immutable while terminal is not revoked.
- revocation clears token hashes before any future activation path is allowed.

## Performance Constraints
- rotation endpoint target latency under normal load: less than 200ms server processing time.
- activation endpoint rate-limited to protect brute force attempts.
- no full-table scans for activation and rotation lookups.
- indexed lookup required for:
  - activation key hash
  - current token hash
  - previous grace token hash

## Acceptance Criteria
- activation with correct fingerprint succeeds.
- activation with mismatched fingerprint fails with `TERMINAL_FINGERPRINT_MISMATCH`.
- rotation creates new token and keeps previous token valid for 5 minutes.
- revoked terminal cannot rotate or activate without explicit admin key regeneration.
- crash-after-rotation scenario works within grace window.
- Prisma generate passes.
- cloud-api build passes.
- spec audit command returns READY for this spec.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-terminal-activation-hardening-v1"`
