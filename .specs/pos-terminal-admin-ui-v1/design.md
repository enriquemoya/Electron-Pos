# Design

## Objective
Define additive online-store architecture for terminal management UI backed by existing cloud-api terminal endpoints.

## Scope
- apps/online-store route, component, and API proxy additions only.
- Existing cloud-api terminal endpoints are consumed as-is.

## Non-Goals
- No backend endpoint contract changes.
- No schema or migration updates.
- No Electron workflow updates.

## Architecture

### Component Flow
- Server route `/{locale}/admin/terminals/page.tsx`
  - validates admin session
  - loads branches and terminal list
  - passes localized labels and initial dataset to `AdminTerminalsPage`.

- `AdminTerminalsPage`
  - renders section layout, actions, and state wrappers
  - composes `TerminalCreateDialog` and `TerminalTable`.

- `TerminalTable`
  - renders paginated rows
  - delegates row actions to `TerminalActions`.

- `TerminalActions`
  - renders dropdown actions and details navigation
  - opens `TerminalRevokeDialog` when revoke requested.

- `TerminalCreateDialog`
  - captures creation form
  - posts to `/api/admin/terminals`
  - renders one-time activation key modal content.

- `TerminalRevokeDialog`
  - uses shadcn `AlertDialog`
  - posts revoke request and handles status/error state.

### Data Access Flow
- Initial server render:
  - `admin-api.ts` -> cloud-api `/admin/terminals` and `/admin/branches`.
- Interactive mutations:
  - client components -> online-store API proxy routes.
- API proxy routes:
  - forward auth cookie bearer token and cloud shared secret
  - forward stable status and payload from cloud-api.

### Routing
- List: `/{locale}/admin/terminals`
- Details: `/{locale}/admin/terminals/{id}`
- Breadcrumb links are deterministic href targets.
- No history-stack-based navigation.

## Security
- All terminal pages call `requireAdmin(locale)`.
- Proxy routes use server-only cloud-api base URL and secret.
- Activation key only exists in in-memory dialog state after create response.
- Activation key is never stored in URL, cookie, localStorage, or persisted hidden inputs.

## UI and UX
- Use shadcn components:
  - `Card`, `Table`, `Badge`, `Button`, `AlertDialog`, `Breadcrumb`, `DropdownMenu`, `Dialog`, `Skeleton`.
- Status badges:
  - `PENDING`: warning/yellow tone
  - `ACTIVE`: success/green tone
  - `REVOKED`: destructive/red tone
- Required states:
  - loading skeleton
  - empty state
  - inline error panel with retry path.

## Error Model
- UI handles backend stable codes and maps to localized copy:
  - `POS_TERMINAL_NOT_FOUND`
  - `TERMINAL_REVOKED`
  - `POS_RATE_LIMITED`
  - `UNAUTHORIZED`
- Unknown code uses localized generic fallback.

## Performance
- Server computes and returns only requested page slice to the client table.
- Page size defaults to 10 and is capped at 50 in route parsing.
- Avoid nested fetch calls inside row components.

## Acceptance Criteria
- Create flow, revoke flow, list, details, pagination, and breadcrumbs behave as specified.
- No `router.back()` usage.
- All UI labels localized for `en-US` and `es-MX`.
- Online-store build passes.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-terminal-admin-ui-v1"`
