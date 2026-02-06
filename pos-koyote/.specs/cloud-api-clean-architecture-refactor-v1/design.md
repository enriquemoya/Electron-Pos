# Design: Cloud API Clean Architecture Refactor v1

## High-level architecture
- Entry point boots Express app and config.
- Routes are split into public and protected routers.
- Controllers handle HTTP concerns and delegate to services.
- Services contain business logic and data access calls.
- Validation helpers parse and validate input.
- Standard internal error model for consistency.

## Proposed structure
- src/index.ts (bootstrap + listen)
- src/app.ts (create app, middleware, routes)
- src/config/env.ts (load and validate env)
- src/middleware/require-secret.ts
- src/db/prisma.ts (PrismaClient singleton)
- src/db/pg.ts (pg client helper with withClient)
- src/errors/api-error.ts (error model + helpers)
- src/validation/*.ts (input validation helpers)
- src/controllers/*.ts
- src/services/*.ts
- src/routes/*.ts

## Data flow
1. Request enters Express app.
2. Public routes handled without secret.
3. Protected routes require shared secret header.
4. Controllers validate input using helpers.
5. Services execute database operations via prisma or pg.
6. Controllers map errors to existing response shape.

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

## Edge cases
- Maintain current idempotency and duplicate behavior.
- Preserve pagination validation and defaults.
- Preserve cache headers on filters endpoint.
