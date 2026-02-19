# Tasks

## Objective
Produce a hardened, additive spec and implementation plan for terminal fingerprint binding, rotation grace window, and revocation safety.

## Scope
- cloud-api
- data

## Non-Goals
- no desktop UI changes in this hardening pass.
- no online-store admin UI changes in this hardening pass.
- no checkout, orders, inventory, or reports changes.

## Functional Requirements
- support fingerprint-bound activation.
- support token rotation grace window for crash recovery.
- enforce strict revocation behavior.
- keep existing activation and rotation behavior compatible.

## Data Model
- add terminal hardening fields only.
- add required lookup indexes.
- keep migration additive and safe.

## Security
- enforce hashing for activation and token fields.
- enforce rate limit on activation.
- reject invalid grace token and revoked terminal access.
- use stable error codes only.

## Architecture
- preserve layering:
  - Controller -> Use case -> Repository -> Prisma -> Database
- keep token hash and lifecycle rules in use case and token service.

## Error Model
Implement and map stable codes:
- `TERMINAL_FINGERPRINT_MISMATCH`
- `TERMINAL_REVOKED`
- `TERMINAL_TOKEN_EXPIRED`
- `TERMINAL_ROTATION_FAILED`
- `TERMINAL_INVALID_GRACE_TOKEN`
- retained compatibility codes from prior terminal spec.

## State Invariants
- revoked terminals cannot be ACTIVE.
- no more than one active token and one grace token.
- fingerprint immutable unless revoke and explicit reactivation path is used.

## Performance Constraints
- indexed token and activation key lookups.
- avoid table scans in activation and rotation paths.
- rotation target less than 200ms under normal conditions.

## Acceptance Criteria
- activation succeeds only on matching fingerprint.
- mismatched fingerprint returns stable mismatch error.
- previous token remains valid for 5 minutes after successful rotation.
- revoked terminal is denied from all token-authenticated paths.
- crash-after-rotation behavior is recoverable during grace window.
- Prisma generate and cloud-api build pass after implementation.
- spec audit returns READY for this slug.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-terminal-activation-hardening-v1"`

## Phase 1 - Spec
1. create requirements, design, and tasks docs with mandatory sections.
2. enforce ASCII-only and English-only content.
3. run spec audit and resolve blockers to READY.

## Phase 2 - Data Hardening Plan
1. add additive terminal fields in Prisma schema.
2. add indexes for activation key and token hashes.
3. prepare additive migration with no destructive operations.

## Phase 3 - Backend Hardening Plan
1. extend activation use case with fingerprint checks.
2. extend rotation use case with grace-token issuance and validation.
3. harden revocation use case to clear active and grace token hashes.
4. add stable error mapping in controller boundary.

## Phase 4 - Verification Plan
1. test activation with correct fingerprint.
2. test activation with mismatched fingerprint.
3. test rotation crash-recovery within 5 minute grace window.
4. test revoked terminal path returns revoke code.
5. run build and governance commands.
