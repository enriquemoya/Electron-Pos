# Design

## Objective
Provide a deterministic activation-first bootstrap for Electron POS with secure token persistence and resilient rotation behavior.

## Scope
- `apps/desktop`: terminal auth secure storage, activation/rotation transport, IPC handlers.
- `apps/web`: activation gate UI wrapper and activation form.
- Cloud API endpoints reused:
  - `POST /pos/activate`
  - `POST /pos/rotate-token`

## Non-Goals
- No database schema changes.
- No cloud-api contract changes.
- No migration changes.
- No broad inventory sync architecture rewrite.

## Architecture

### Main Process Flow
- `main.js` registers terminal auth IPC handlers.
- IPC handlers call terminal auth service methods:
  - `getState`
  - `activate`
  - `rotate`
  - `clear`
- Terminal auth service composes:
  - secure storage adapter (encrypted file in userData)
  - fingerprint provider
  - cloud transport client.

### Renderer Flow
- Root shell mounts activation gate client component.
- Gate boot sequence:
  1. read terminal auth state via preload bridge
  2. if not activated -> render activation screen
  3. if activated -> attempt rotate
  4. update UI to active or offline based on rotation result
  5. if revoked/invalid -> force activation screen.

### Secure Persistence
- Encrypted payload contains:
  - terminalId
  - branchId
  - deviceToken
  - deviceFingerprint
  - lastVerifiedAt
  - activatedAt
- Payload is encrypted with `safeStorage` and stored in userData file.

### Cloud Transport
- Activation request body:
  - `activationApiKey`
  - `deviceFingerprint`
- Rotation request uses `Authorization: Bearer <deviceToken>`.
- Shared helper detects terminal auth failure codes and marks state as revoked.

### UI States
- `checking`
- `notActivated`
- `activating`
- `active`
- `offline`
- `revoked`

## Security
- No localStorage writes for token or activation key.
- Activation key exists in memory only during submit.
- Wipe on revoked/invalid token immediately removes secure file.
- Preload exposes minimal terminal-auth API surface.

## Error Model
- Activation UI messages map to stable backend codes.
- Rotation/network failures are classified as:
  - recoverable offline
  - terminal revoked/invalid (non-recoverable without activation)
  - generic failure.

## Acceptance Criteria
- Activation gate blocks protected app shell until activated.
- Rotation runs on startup and updates local token on success.
- Offline startup works with previous token.
- Revocation/invalid token always clears local auth and returns activation screen.
- Touched app builds pass.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-electron-activation-flow-v1"`
