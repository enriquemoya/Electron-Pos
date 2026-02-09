# Design: Cloud API Clean Architecture Refactor v1

## High-level architecture
- Presentation layer: routes + controllers only (HTTP mapping, no business logic).
- Application layer: use cases orchestrate domain rules, no framework imports.
- Domain layer: entities and domain rules, no Prisma or HTTP imports.
- Infrastructure layer: Prisma repositories, pg access, email adapters.
- Dependencies always point inward toward domain.

## Layer responsibilities
- Presentation: request parsing, response mapping, error translation.
- Application: use case execution, orchestration of domain + repositories.
- Domain: entities, value objects, domain rules, invariants.
- Infrastructure: DB clients, repository implementations, external services.

## Dependency rules
- Presentation -> Application only.
- Application -> Domain only (plus interfaces).
- Infrastructure -> Application/Domain (implements interfaces).
- Domain imports no framework, DB, or HTTP code.
- Application does not import Prisma or pg directly.

## Folder structure (before -> after)
Before:
- src/index.ts (single file with routes, logic, data access)

After:
- src/index.ts (bootstrap + listen)
- src/app.ts (create app, middleware, routes)
- src/config/env.ts (load and validate env)
- src/middleware/require-secret.ts
- src/errors/api-error.ts (error model + helpers)
- src/presentation/routes/*.ts
- src/presentation/controllers/*.ts
- src/application/use-cases/*.ts
- src/application/ports/*.ts (interfaces)
- src/domain/entities/*.ts
- src/infrastructure/db/prisma.ts
- src/infrastructure/db/pg.ts
- src/infrastructure/repositories/*.ts
- src/infrastructure/adapters/*.ts
- src/validation/*.ts (input validation helpers, called by controllers)

## Data flow
1. Request enters Express app.
2. Public routes handled without secret.
3. Protected routes require shared secret header.
4. Controllers validate input using helpers.
5. Controllers call use cases (application layer).
6. Use cases call domain rules and repository interfaces.
7. Infrastructure repositories access Prisma or pg.
8. Controllers map errors to existing response shape.

## Data model
- No data model changes. Uses existing Prisma models and existing pg tables.

## API contracts
- All endpoint URLs, methods, status codes, and response shapes remain unchanged.
- Auth boundary remains identical (filters public, all others require secret).

## Error model
- Internal error type: status, code, message.
- Controllers translate internal error to existing JSON responses.
- Example outputs preserved (e.g., {"error":"unauthorized"}).

## Validation
- No new dependency; use explicit checks as in current code.
- Validation helpers return structured results for controllers.

## Endpoint mapping
Public (no secret):
- GET /api/cloud/catalog/filters

Protected (secret required):
- POST /sync/events
- GET /sync/pending
- POST /sync/ack
- POST /orders
- GET /read/products
- GET /api/cloud/catalog/featured

## Data access
- Prisma remains for read model inventory endpoints.
- pg client remains for sync/event/order flows.

## Mapping of existing files to layers
- src/index.ts -> presentation/app bootstrap (index.ts + app.ts)
- src/app.ts -> presentation/app bootstrap (unchanged role)
- src/routes/* -> presentation/routes/*
- src/controllers/* -> presentation/controllers/*
- src/services/* -> application/use-cases/*
- src/db/prisma.ts -> infrastructure/db/prisma.ts
- src/db/pg.ts -> infrastructure/db/pg.ts
- src/errors/api-error.ts -> shared across layers (presentation/application)
- src/validation/* -> presentation validation helpers

## Edge cases
- Maintain current idempotency and duplicate behavior.
- Preserve pagination validation and defaults.
- Preserve cache headers on filters endpoint.
