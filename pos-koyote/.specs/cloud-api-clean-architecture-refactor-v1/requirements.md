# Requirements: Cloud API Clean Architecture Refactor v1

## Problem statement
The Cloud API backend needs a clearer structure to improve readability,
testability, and long term maintenance. We must apply Clean Architecture
layers while keeping external behavior identical.

## Goals
- Apply Clean Architecture layers (presentation, application, domain, infrastructure).
- Refactor Cloud API into modular structure with thin controllers and routes.
- Preserve existing endpoint behavior, status codes, and response shapes.
- Preserve current auth boundary behavior (shared secret middleware).
- Keep Prisma as data access layer and pg client usage where currently used.
- Introduce a standard internal error model and validation patterns.

## Scope
- Refactor current Cloud API routes and logic without changing behavior.
- Include existing endpoints only (public filters and protected sync/orders/read endpoints).
- Create application use cases and domain entities as needed to express current behavior.

## Non-goals
- No functional behavior changes to endpoints.
- No new endpoints.
- No UI, online-store, or POS changes.
- No schema or migration changes.
- No auth or security boundary changes.
- No DTO or response shape changes.
- No error message changes.

## Constraints
- Cloud API only (and shared packages only if strictly necessary).
- No data/schema changes.
- Prisma remains the ORM for read models.
- Keep existing pg usage for sync flows.
- Maintain existing error payload strings and status codes externally.
- No new dependencies unless explicitly required and approved.
- Dependencies must point inward (presentation -> application -> domain).
- Domain layer must not import framework, Prisma, or HTTP dependencies.
- Application layer must not import Prisma directly.

## Assumptions
- Current endpoints live in a single file: src/index.ts.
- Runtime behavior is stable and should remain identical post-refactor.
- Environment variables remain the same (DATABASE_URL, CLOUD_SHARED_SECRET, PORT).

## Out of scope
- Performance optimization.
- Adding tests or new tooling.
- Changing database access patterns beyond structure/placement.

## i18n
- Not applicable (API-only service; no user-facing localized strings).

## Error handling
- Standardize internal error representation while preserving external responses.
- Each route must return the same status codes and error strings as before.

## Validation
- Validate request payloads and query parameters using shared validation helpers.
- Validation failures must return the same errors as current behavior.
