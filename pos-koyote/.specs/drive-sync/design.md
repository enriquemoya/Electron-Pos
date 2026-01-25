# Design: Drive Sync

## Flow
1) User connects via device code.
2) User uploads Excel to Drive.
3) User downloads Excel and can apply it to local DB.

## Integration Layer
- Electron main hosts Drive client, auth, and sync logic.
- Tokens stored encrypted on disk.
- Sync state stored locally.

## Renderer
- Calls `window.koyote.driveSync` for connect/upload/download.
- Applying Drive file uses existing Excel import logic and IPC writes.

## Safety
- Download does not auto-apply; user explicitly applies.