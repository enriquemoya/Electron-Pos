# Requirements: Users and Roles v1

## Problem statement
The online store lacks a user system and admin tooling. We need customer and
admin roles with safe handling of PII, database persistence, and admin-only
CRUD endpoints, without changing public API exposure.

## Goals
- Introduce user records with roles and statuses.
- Add admin-only CRUD endpoints to manage users.
- Provide a minimal admin UI only if required for management.
- Ensure PII safety (email/phone) with minimal exposure in public APIs.
- Preserve existing Cloud API behavior outside the new user endpoints.
- Add customer profile fields (first name, last name, birth date) and addresses.

## Scope
- Cloud API endpoints for admin-only user management.
- Prisma schema updates and migrations for user data.
- Optional online-store admin pages only if required for CRUD management.
- Address data stored in a separate table with Mexican address fields.

## Non-goals
- No JWT auth implementation (separate spec).
- No changes to cart/checkout.
- No POS changes.
- No public user profile endpoints.

## Constraints
- Cloud API + data only; online-store admin pages only if required.
- Keep Prisma as data access layer.
- Preserve existing auth boundary patterns.
- No PII exposure in public APIs.
- No breaking changes to existing endpoints.
- Pagination required for admin user listing.

## Assumptions
- Admin-only endpoints can be protected via existing shared-secret middleware.
- User management is performed via admin endpoints; no public signup.
- At least one of email or phone is required and must be unique when present.

## Out of scope
- Token issuance or login flows.
- Password management and credential storage.
- Email verification or notification systems.
- Payments, orders, tournaments, or store credit tables (future consideration only).

## i18n
- If admin UI is added, all user-visible strings must be localized.

## Error handling
- Validation errors return consistent error payloads.
- Admin endpoints must not leak PII in error messages.

## Validation
- Validate email and phone formats when present.
- Enforce role and status values via validation helpers.
- Validate address fields and enforce required fields for address records.

## Pagination
- Admin user listing must accept page/pageSize and return paginated results.
