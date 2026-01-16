# Application Shell & Recovery (Electron Hardening) - Design

## Electron Menu Structure
- Remove default "Help" menu.
- "Archivo" menu:
  - "Volver al inicio" (Ctrl+Shift+H / Cmd+Shift+H)
  - "Salir" (always present)
- All labels in Spanish (MX), i18n-ready.

## Recovery IPC Flow
1) Electron menu action triggers IPC message.
2) Renderer receives a recovery command.
3) Renderer forces navigation to `/dashboard` (fallback: `/`).
4) This bypasses current router state to avoid traps.

## Error Classification
- DB errors: open failure, corruption, or schema mismatch.
- IPC errors: unhandled exceptions or invalid payloads.
- Render errors: React error boundary catches.
- Data errors: critical model is invalid or missing.

## Error Routing Strategy
- `/error/db`: DB open or corruption issues.
- `/error/data`: critical data invalid or missing.
- `/error/render`: renderer crash or rendering failure.
- `/error/generic`: unknown fatal error.

## Fatal Error UX
- Clear, short description in Spanish (MX).
- Action buttons:
  - "Volver al inicio"
  - "Reiniciar aplicacion"
- No technical stack traces in UI.

## Shell vs App Responsibilities
- Shell (Electron main):
  - Menu setup and i18n labels.
  - Recovery IPC command emission.
  - Detects DB open failure and routes to `/error/db`.
- App (renderer):
  - Error boundaries and route rendering.
  - Handles recovery command and navigates to safe route.

## Timezone
- No change; operator local time remains the rule.

## Native Localization
- Window title, menu labels, and dialog copy use a shared dictionary.
- The shell uses a minimal dictionary or shared i18n module.

## Documentation Constraints
- All documentation text in this SPEC must use ASCII characters only.
- Accented characters are not permitted.
- Localization and accented characters are handled at runtime via i18n, not in the SPEC text itself.


