# SPEC: Drive Sync

## Goal
Mirror the local inventory Excel file to Google Drive and allow manual re-import.

## Scope
- OAuth device flow in Electron main process.
- Upload local Excel to Drive.
- Download Excel from Drive.
- Apply downloaded Excel to local DB when user confirms.

## Constraints
- Local SQLite is source of truth.
- Drive never overwrites local data silently.
- Tokens stored in Electron main (encrypted).
- Renderer only triggers actions via IPC.

## Out of Scope
- Google Sheets API
- Background sync
- Multi-user conflict UI