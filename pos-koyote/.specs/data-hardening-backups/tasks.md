# Data Hardening & Backups - Tasks

## Phase 1 - Electron / Main Process
- Implement backup creation with rotation.
- Add backup triggers (startup, daily, before migrations).
- Detect DB corruption on open.
- Implement restore flow with safe restart.

## Phase 2 - IPC Layer
- Expose backup list and status endpoints.
- Expose restore trigger with confirmation requirement.
- Return clear errors for failed operations.

## Phase 3 - Renderer (Minimal)
- Display backup list and last backup status.
- Provide restore action only in recovery flows.
- Show warnings and confirmations.

## Phase 4 - Validation
- Simulate DB corruption and verify recovery path.
- Simulate backup failure and verify warning.
- Simulate restore failure and verify recovery lock.
- Verify restore success and app restart.
