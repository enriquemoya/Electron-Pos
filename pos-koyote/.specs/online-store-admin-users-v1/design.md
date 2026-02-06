# Design: Online Store Admin Users v1

## High-level architecture
- Admin pages in online-store using App Router.
- Server components fetch user list and user details.
- Client components only for interactive controls (role/status select).
- Auth/role guard applied at route level.

## Routes
- /[locale]/admin/users (list)
- /[locale]/admin/users/[id] (detail)

## Data flow
1. Server component calls Cloud API admin endpoints with server-side secret or
   auth token per auth spec.
2. Render list/detail with localized labels.
3. Role/status update submits to a server action or route handler.

## Auth/role guard
- Guard checks request header `x-user-role` for value `ADMIN`.
- If missing or not admin, redirect to /{locale}.

## API contracts (consumed)
- GET /admin/users?page=1&pageSize=20 -> { items, page, pageSize, total, hasMore }
- GET /admin/users/:id -> { user }
- PATCH /admin/users/:id -> { user }

## State ownership
- Server components own data fetching.
- Client components handle local form state only.

## Error states
- List: show localized empty/error state.
- Detail: show not-found or error states.

## i18n and accessibility
- Use next-intl for all labels.
- Provide aria labels for interactive controls.

## Edge cases
- Role/status update failure shows inline error message.
- Pagination handles empty pages gracefully.
- Inline update requires confirmation modal before submit.
