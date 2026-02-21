# Tasks

## Objective
Ship activation gating and token lifecycle support in Electron POS with strict security handling for local credentials.

## Scope
- `apps/desktop`
- `apps/web`
- no schema changes
- no migration changes

## Non-Goals
- No online-store changes.
- No backend endpoint redesign.
- No full sync refactor.

## Security
- Encrypted terminal credential storage only.
- No localStorage token persistence.
- Wipe credentials on terminal revocation semantics.
- Avoid production console logging in new runtime code.

## Architecture
- Add terminal auth service in desktop integration layer.
- Add IPC handlers and preload bridge methods.
- Add renderer activation guard component in app shell.
- Use cloud transport utility for terminal-authenticated requests.

## Error Model
- Handle stable codes:
  - `POS_INVALID_ACTIVATION_KEY`
  - `TERMINAL_REVOKED`
  - `TERMINAL_INVALID_TOKEN`
  - `POS_RATE_LIMITED`
  - `POS_TERMINAL_NOT_FOUND`
- Map to user-facing activation and revoked states.

## Acceptance Criteria
1. Activation screen appears for non-activated installs.
2. Activation succeeds with valid key and unlocks shell.
3. Rotation on startup updates token when online.
4. Offline startup remains usable with previous token.
5. Revoked token forces wipe and activation screen.
6. Secrets are not stored in localStorage.
7. No router back regressions introduced.
8. Build and governance commands pass.

## Phase 1 - Spec
1. Create requirements, design, tasks.
2. Run spec audit.
3. Resolve blockers.

## Phase 2 - Desktop Core
1. Add secure terminal auth storage and fingerprint generation.
2. Add activation and rotation transport methods.
3. Add terminal auth IPC handlers.
4. Add preload bridge methods.

## Phase 3 - Renderer Gate
1. Add activation gate wrapper in app shell.
2. Add activation screen component and states.
3. Add startup rotation call with offline fallback.
4. Handle revoked semantics by clearing and returning to activation.

## Phase 4 - Cloud Sync Token Hook
1. Add terminal token attachment helper for cloud sync requests.
2. Ensure terminal auth failures trigger local wipe path.

## Phase 5 - Validation
1. `npm run gov:spec:audit -- "pos-electron-activation-flow-v1"`
2. `npm run gov:impl:audit -- "pos-electron-activation-flow-v1"`
3. `npm run build -w apps/cloud-api`
4. `npm run build -w apps/online-store`
5. `npm run build -w apps/desktop`

## Local Smoke Checklist
- Remove terminal auth file and start app -> activation screen.
- Activate with valid key -> app unlocks.
- Restart with network -> rotate success.
- Restart without network -> offline mode banner and app unlocked.
- Revoke terminal in admin -> next rotate/request returns to activation.
