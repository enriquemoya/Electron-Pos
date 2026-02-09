IPC Electron SQLite skill

Rules
- Renderer never touches SQLite.
- All persistence is via IPC in Electron main.
- DTOs are stable and versioned by spec.

Checklist
- Validate IPC boundary for any new data access.
- No direct DB imports in renderer.
