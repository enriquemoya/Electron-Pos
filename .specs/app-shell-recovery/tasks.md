# Application Shell & Recovery (Electron Hardening) - Tasks

## Phase 1 - Menu Customization
- Remove default Help menu.
- Add Archivo menu with:
  - Volver al inicio (Ctrl+Shift+H / Cmd+Shift+H)
  - Salir (always present)
- Ensure menu strings are localized.

## Phase 2 - IPC Recovery Command
- Add IPC channel for recovery command.
- Renderer listens and navigates to `/dashboard` (fallback `/`).

## Phase 3 - Error Routes
- Create routes:
  - /error/db
  - /error/data
  - /error/render
  - /error/generic
- Each route provides recovery actions.

## Phase 4 - Error Detection Hooks
- Detect DB open failure in Electron main.
- Catch IPC handler errors at boundary.
- Add renderer error boundary to capture crashes.

## Phase 5 - i18n Integration
- Add native dictionary entries for menu and error dialogs.
- Use shared labels where possible.

## Phase 6 - Validation & Failure Simulation
- Simulate DB failure and ensure route /error/db appears.
- Simulate renderer crash and ensure /error/render appears.
- Validate recovery action always returns to /dashboard.
