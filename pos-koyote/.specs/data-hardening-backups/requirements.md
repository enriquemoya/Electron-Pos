# Data Hardening & Backups - Requirements

## Goals
- Protect local SQLite data from loss or corruption.
- Provide automatic local backups with rotation.
- Provide safe manual restore for operators.
- Fail safely when data is not usable.

## Users
- Store owner
- POS staff

## Backup Strategy
- Automatic local backups of the SQLite file.
- Backup triggers:
  - App start (before opening DB)
  - Daily (first open per local day)
  - Before migrations
- Retention policy: keep last N backups (configurable, default 10).
- Backup file naming: ASCII-only, timestamp-based, deterministic.
  - Example: backup-YYYYMMDD-HHMMSS.db

## Restore Strategy
- Manual restore initiated by operator only.
- Restore is available only from Electron shell or recovery routes.
- Restore overwrites local data and requires explicit confirmation.
- After restore, the app restarts safely.

## Corruption Detection
- Detect unreadable or invalid SQLite DB at startup.
- If corruption is detected:
  - Block normal app flow
  - Route to recovery screen
  - Offer restore option

## Failure Modes
- Backup fails:
  - Log locally
  - Show warning in recovery or status view
- Restore fails:
  - Keep app in recovery mode
  - Do not proceed to normal UI
- Disk full:
  - Stop creating backups
  - Surface warning
- DB cannot be opened:
  - Enter recovery flow

## Constraints
- SQLite remains the single source of truth.
- Renderer never accesses DB directly.
- IPC-only communication for backup and restore.
- No cloud backups, local only.
- ASCII-only documentation rule applies.

## Out of Scope
- Cloud sync
- Encryption at rest
- Multi-device replication
- Remote recovery tools
