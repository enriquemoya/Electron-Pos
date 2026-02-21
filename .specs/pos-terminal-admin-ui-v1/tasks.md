# Tasks

## Objective
Implement terminal management admin UI in online-store using existing cloud-api terminal endpoints.

## Scope
- apps/online-store only.
- Add routes, components, API proxy handlers, and i18n keys.

## Non-Goals
- No backend modifications.
- No Prisma changes.
- No migrations.

## Functional Requirements
- List terminals with status and metadata.
- Create terminal and show one-time activation key.
- Revoke terminal with confirmation.
- Terminal details route with metadata and revoke control.
- Deterministic breadcrumb navigation.

## Security
- Admin guard required on pages.
- No client-side key persistence.
- No console logging in new runtime paths.
- Stable backend error handling.

## Architecture
- Implement and wire:
  - `AdminTerminalsPage`
  - `TerminalTable`
  - `TerminalActions`
  - `TerminalCreateDialog`
  - `TerminalRevokeDialog`
- Add API proxy routes under `/api/admin/terminals`.

## Error Model
- Map known backend codes to localized UI messages.
- Provide generic fallback for unknown failures.

## Acceptance Criteria
1. Create terminal flow returns and displays activation key once.
2. Revoke flow works and updates visible status.
3. Details page resolves terminal metadata by id.
4. List pagination works and supports deep links via `?page=`.
5. Breadcrumbs render correctly and no `router.back()` remains in this scope.
6. Build passes for online-store.

## Phase 1 - Spec
1. Create requirements, design, and tasks for `pos-terminal-admin-ui-v1`.
2. Run spec audit.
3. Resolve blockers until READY.

## Phase 2 - API Proxy and Data Layer
1. Add online-store API proxy endpoints:
   - `GET/POST /api/admin/terminals`
   - `POST /api/admin/terminals/{id}/revoke`
2. Add terminal types and fetch helpers in `admin-api.ts`.

## Phase 3 - Routes and Components
1. Add list page route and details page route.
2. Build reusable terminal components with required layering.
3. Add pagination controls and status badges.
4. Add create and revoke dialogs.
5. Add breadcrumbs and deterministic links.

## Phase 4 - i18n and QA
1. Add `adminTerminals` namespace keys in `en-US` and `es-MX`.
2. Verify loading, empty, and error states.
3. Verify key copy flow and one-time visibility behavior.

## Phase 5 - Validation
1. Run:
   - `npm run build -w apps/online-store`
   - `npm run gov:impl:audit -- "pos-terminal-admin-ui-v1"`
2. Document SAFE or NOT SAFE with file-level evidence.

## Spec Audit Command
- `npm run gov:spec:audit -- "pos-terminal-admin-ui-v1"`
