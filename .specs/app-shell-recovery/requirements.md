# Application Shell & Recovery (Electron Hardening) - Requirements

## Goals
- Make the Electron shell predictable, localized, and safe for daily store use.
- Provide a global recovery action to return to a safe route.
- Prevent operators from being trapped on broken screens.
- Handle fatal errors with clear, actionable UI.

## Users
- Store owner
- POS staff

## Failure Scenarios
- SQLite open failure or corruption.
- IPC handler throws unrecoverable error.
- Renderer crash or blank screen.
- Invalid critical data that cannot be rendered.
  - Use `/error/data` for invalid, corrupt, or non-renderable domain data.
  - Use `/error/generic` for unknown or uncategorized errors.

## Recovery Expectations
- The app must expose a global "Volver al inicio" action.
- Recovery must work even if the current route is broken.
- Error routes must explain the issue and provide next steps.

## Language and i18n
- Native labels must be Spanish (MX).
- Menu and dialogs must be i18n-ready for future languages.

## Documentation Constraints
- All documentation text in this SPEC must use ASCII characters only.
- Accented characters are not permitted.
- Localization and accented characters are handled at runtime via i18n, not in the SPEC text itself.

## Constraints
- Local-first architecture remains unchanged.
- Renderer never talks to SQLite directly.
- IPC is the only bridge for recovery signals.
- Read-only recovery actions (no data changes).

## Out of Scope
- Automated repair or migration tools.
- Remote diagnostics.
- Telemetry or error reporting services.
