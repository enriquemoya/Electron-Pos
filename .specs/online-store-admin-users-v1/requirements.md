# Requirements: Online Store Admin Users v1

## Problem statement
The online store needs an admin UI to manage users and roles using existing
Cloud API admin endpoints, without exposing secrets or adding new APIs.

## Goals
- Provide admin UI to list users with pagination.
- Provide admin UI to view a user's details.
- Allow admins to update role and status for a user.
- Use server-side data fetching only; no secrets in client components.
- Localize all strings via next-intl.

## Scope
- Online-store admin UI only.
- Consume existing Cloud API admin endpoints.
- Route protection via auth/role guard (assume JWT exists per auth spec).

## Non-goals
- No Cloud API changes.
- No POS changes.
- No user creation or address editing in this UI.
- No new authentication implementation.

## Constraints
- Online-store only.
- Use shadcn/ui + Tailwind + lucide icons.
- Mobile-first and responsive.
- Server-side data fetching only.
- No secrets in client components.
- Admin routes guarded via request header role check.

## Assumptions
- Auth/role guard utilities exist per auth spec.
- Cloud API admin endpoints are reachable from server components.
- Admin role is conveyed via request header `x-user-role: ADMIN`.

## Out of scope
- Admin user creation and deletion.
- Address management UI.
- JWT implementation details.

## i18n
- All user-visible strings must be localized.

## Error handling
- Show non-sensitive error messages for API failures.
- Unauthorized access must redirect or deny access per auth guard.

## Validation
- Role/status updates must validate allowed values before submit.

## Pagination
- Admin user list uses page/pageSize; default pageSize = 20.
