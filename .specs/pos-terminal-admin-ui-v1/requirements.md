# Requirements

## Objective
Deliver a production admin terminals management UI in online-store that consumes existing cloud-api terminal activation and revoke endpoints without backend behavior changes.

## Scope
- apps/online-store only.
- Admin routes:
  - `/{locale}/admin/terminals`
  - `/{locale}/admin/terminals/{id}`
- Additive frontend API proxy usage to existing backend endpoints.
- Localized UI in `es-MX` and `en-US`.

## Non-Goals
- No cloud-api business logic changes.
- No Prisma schema changes.
- No migrations.
- No Electron POS UI changes.
- No activation or token rotation protocol changes.

## Functional Requirements

### 1) Terminal List
- Render terminals table with columns:
  - terminal name
  - branch
  - status (`PENDING`, `ACTIVE`, `REVOKED`)
  - last rotation timestamp (`lastSeenAt`)
  - created at
- Terminal list route: `/{locale}/admin/terminals`.
- Pagination is required in UI.
- UI must call existing cloud-api terminal list endpoint through online-store server-side proxy.
- No deep nested component may call cloud-api directly.

### 2) Create Terminal
- Create dialog includes:
  - terminal name input
  - branch selector
- Submit calls existing backend create endpoint.
- On success, display activation API key in one-time modal state.
- Activation key must support copy-to-clipboard.
- Activation key must not persist in local storage, cookies, or URL.

### 3) Revoke Terminal
- Revoke uses `AlertDialog` confirmation.
- On revoke success:
  - status updates to `REVOKED`
  - destructive actions become disabled.

### 4) Terminal Details
- Details route: `/{locale}/admin/terminals/{id}`.
- Display:
  - terminal metadata
  - branch
  - status
  - last rotation
  - created at
  - revoke action when allowed.
- Reactivation is out of scope for this UI.

### 5) Breadcrumb
- Breadcrumb required:
  - `Home / Admin / Terminals / {Terminal Name}` for details
  - `Home / Admin / Terminals` for list
- Must use shadcn breadcrumb primitives through shared app breadcrumb component.
- Must not use `router.back()`.

## Security
- Admin pages require existing admin session guard.
- Admin API proxy routes require auth cookie forwarding and cloud shared secret.
- No API keys persisted client-side.
- No token persistence added in frontend.
- No `console.*` in production code paths.
- Stable backend error codes must be handled gracefully:
  - `POS_TERMINAL_NOT_FOUND`
  - `TERMINAL_REVOKED`
  - `POS_RATE_LIMITED`
  - `UNAUTHORIZED`

## Architecture
- Required frontend layering:
  - `page.tsx` (server entry)
  - `AdminTerminalsPage`
  - `TerminalTable`
  - `TerminalActions`
  - `TerminalCreateDialog`
  - `TerminalRevokeDialog`
- Data access is centralized in:
  - server API proxy routes (`/api/admin/terminals...`)
  - server helper fetch layer (`admin-api.ts`) for initial load.
- No monolithic page with inline mutation logic.

## Error Model
- UI must map backend stable codes to localized error messages.
- UI must provide user-visible state for:
  - loading
  - empty
  - recoverable error.
- Unknown errors fall back to a localized generic message.

## Acceptance Criteria
1. Admin can create a terminal and see activation key once.
2. Admin can copy activation key from result modal.
3. Admin can revoke terminal with `AlertDialog` confirmation.
4. Terminal list and details pages render correct status badges and metadata.
5. Pagination works on list route UI.
6. Breadcrumb is correct and no `router.back()` is used.
7. No `console.*` introduced in new production paths.
8. Build passes: `npm run build -w apps/online-store`.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-terminal-admin-ui-v1"`
