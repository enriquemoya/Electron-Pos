# Requirements

## Objective
Implement terminal activation gating and token lifecycle handling in the Electron POS app so the POS can only operate with a valid activated terminal identity.

## Scope
- `apps/desktop` main process, preload bridge, and terminal auth integration.
- `apps/web` Electron renderer gating UI and startup flow.
- Cloud API usage is consume-only through existing endpoints.
- No Prisma changes.
- No migrations.
- No online-store UI changes in this slug.

## Non-Goals
- No checkout flow changes.
- No inventory domain redesign.
- No full cloud sync refactor.
- No terminal admin UI changes.
- No backend business logic rewrite unless a missing endpoint blocks activation flow.

## Functional Requirements

### Activation Gating
- On startup, if no terminal auth exists locally, render activation screen only.
- Activation screen accepts terminal activation API key.
- Activation calls existing `POST /pos/activate`.
- Activation success stores terminal identity and token in secure local persistence and unlocks app.
- If already activated, activation screen is skipped.

### Rotation
- On each startup, if activated, call `POST /pos/rotate-token` with bearer token.
- Rotation success persists new token and updates last verified timestamp.
- If rotation fails due to network/unreachable, continue in offline mode with existing token.
- If rotation fails due to revoked or invalid token semantics, wipe credentials and force activation screen.

### Revocation Handling
- Revocation response codes (`TERMINAL_REVOKED`, `TERMINAL_INVALID_TOKEN`, related 401/403 terminal auth failures) trigger local credential wipe.
- Wipe action returns app to activation screen immediately.

### Request Auth
- POS cloud sync/write requests must attach terminal bearer token from secure storage.
- Terminal auth failures in these requests trigger wipe + return to activation state.

## Security
- No terminal secrets in renderer localStorage.
- Persist terminal secrets only in encrypted local file via Electron safe storage abstraction.
- Renderer stores only non-sensitive UI state.
- No production `console.*` in new runtime paths.
- Activation key is not persisted after successful activation.

## Architecture
- Main process layering:
  - IPC handler -> terminal auth use case service -> secure storage + cloud transport.
- Renderer layering:
  - layout shell -> activation guard component -> activation screen or app content.
- Cloud transport wrapper centralizes terminal-authenticated requests and error code mapping.

## Error Model
- Map backend stable terminal codes to deterministic client states:
  - `POS_INVALID_ACTIVATION_KEY`
  - `TERMINAL_REVOKED`
  - `TERMINAL_INVALID_TOKEN`
  - `POS_RATE_LIMITED`
  - `POS_TERMINAL_NOT_FOUND`
- Unknown errors map to generic activation/rotation failure UI state.

## Acceptance Criteria
1. Fresh install shows activation screen only.
2. Valid key activates terminal and unlocks app.
3. Restart online rotates token successfully.
4. Restart offline keeps app unlocked and shows offline status.
5. Revoked terminal is wiped and forced back to activation.
6. No terminal secrets in localStorage.
7. No `router.back/goBack` regressions introduced.
8. No production `console.*` in new runtime paths.
9. Builds pass for touched apps.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-electron-activation-flow-v1"`
