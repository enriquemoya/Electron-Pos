# Design: Local Persistence

## Data Layer
- `packages/db` holds schema + repositories.
- `better-sqlite3` provides sync access.

## Electron Integration
- DB initialized in main process at startup.
- Repositories injected into IPC handlers.

## Renderer
- Uses `window.api` IPC only.
- No local storage of authoritative data.