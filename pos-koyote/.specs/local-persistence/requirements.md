# SPEC: Local Persistence

## Goal
Persist products, inventory, sales, and sync state locally via SQLite.

## Scope
- SQLite schema in packages/db
- Repositories for products, inventory, sales, sync_state
- Electron main initializes DB and exposes IPC

## Constraints
- Renderer never accesses SQLite directly.
- SQLite is the single source of truth.
- IPC is the only persistence path.

## Out of Scope
- Remote DB
- Background jobs