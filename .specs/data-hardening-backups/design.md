# Data Hardening & Backups - Design

## Backup Location
- Backups live in a local app data folder under a dedicated backups directory.
- The directory is created on first run if missing.

## Backup Triggers
- App start: create backup before opening DB.
- Daily: create one backup per local day when app opens.
- Before migrations: create backup immediately before any schema change.

## Restore Flow
1) Operator selects a backup from a list.
2) System shows a warning that restore overwrites current data.
3) Operator confirms restore.
4) Main process closes DB connection.
5) Backup file replaces the active DB file.
6) App restarts to ensure clean state.

## IPC Boundaries
- Renderer can request:
  - List backups
  - Trigger restore
  - Check last backup status
- Main process performs:
  - File operations
  - DB close and reopen
  - Restart after restore

## Safe Startup Flow
- Normal:
  - Create backup if needed
  - Open DB
  - Continue to app
- Corrupt DB detected:
  - Skip normal app flow
  - Route to recovery screen
  - Allow restore
- Restore required:
  - App stays in recovery until a restore succeeds

## Relationship to App Shell and Recovery
- Recovery routes display restore options.
- Electron menu recovery action can route to recovery screens.

## Logging Expectations
- Minimal local logs for backup and restore events.
- No PII in logs.
- Logs are local only.
