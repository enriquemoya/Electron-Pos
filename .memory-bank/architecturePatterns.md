# Architecture Patterns

## Layered Architecture
- UI Layer:
  - apps/web
  - packages/ui
  - Presentation only
  - No business logic
  - No database access

- Domain Layer:
  - packages/core
  - Domain models and business rules
  - No framework or UI dependencies

- Data Layer:
  - packages/db
  - SQLite repositories
  - Persistence and queries only

- Desktop Shell:
  - apps/desktop
  - Electron main + preload
  - IPC boundaries only
  - No business rules

## Routing
- Next.js App Router only
- Server Components by default
- Client Components only when browser APIs are required
- Static export detail pages may use a stable route plus query param (e.g., `/tournaments/detail?id=...`) to avoid build-time params.

## UI Layout
- Persistent left navigation
- Main content area
- Dark theme optimized for POS usage
- Large touch-friendly targets

## Local-First Strategy
- All date rendering and day-boundary logic must use the machine's local timezone (no UTC parsing of YYYY-MM-DD).
- SQLite as single source of truth
- Renderer must not persist authoritative data (no localStorage)
- IPC is the only path to persistence
- Internet connectivity is optional
- Sync strategies defined later

## AI Governance Rules (CRITICAL)

### Memory Bank Authority
- The `.memory-bank` directory is the single source of truth for project context.
- Any architectural decision, feature addition, or dependency change MUST update the Memory Bank.

### Mandatory Memory Updates
For every meaningful change:
- Update `activeContext.md`
- Update `progress.md`
- Update `techContext.md` if tooling changes
- Update this file if architecture changes

### Agent Responsibilities
- Front-End Agent:
  - UI, routes, components, styling
  - Must NOT implement business logic

- Back-End Agent:
  - Domain models, services, repositories
  - Must NOT touch UI components

- Memory Bank Agent:
  - Ensures documentation consistency
  - Logs decisions and progress

### Forbidden Practices
- Business logic inside UI components
- Direct DB access from UI
- Skipping Memory Bank updates
- Tight coupling between layers
