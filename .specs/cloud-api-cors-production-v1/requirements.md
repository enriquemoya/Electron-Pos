 # Requirements: cloud-api CORS production v1

## Goals
- Allow the online-store frontend at https://danimezone.com to call cloud-api endpoints in production.
- Allow localhost development without environment switching.
- Keep CORS strict and explicit with no wildcard origins.
- Ensure preflight requests are handled correctly and cached.

 ## Scope
 - cloud-api only.
 - Add a centralized, reusable CORS configuration module.
 - Apply CORS at application entry point before routes.
 - Configure CORS to allow only specified origins and headers.

 ## Non-Goals
 - No changes to business logic.
 - No changes to API contracts or response shapes.
 - No changes to authentication or authorization.
 - No changes to routing or controller behavior.

## Constraints
 - CORS must be explicit and restrictive.
 - No wildcard "*" origin.
 - No dynamic reflection of Origin header.
-- Production allowed origins only:
  - https://danimezone.com
  - https://www.danimezone.com
  - https://api.danimezone.com
- Allowed origins only:
  - https://danimezone.com
  - https://www.danimezone.com
  - https://api.danimezone.com
  - http://localhost:3000
 - methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
 - allowed headers: Content-Type, Authorization, X-Cloud-Secret, X-Requested-With
 - credentials: true
 - Access-Control-Max-Age: 86400
 - OPTIONS requests must short-circuit correctly.
- Environment resolution is not used for CORS in this version.
 - Configuration must live in apps/cloud-api/src/config/cors.ts (or equivalent).

 ## i18n
 - Not applicable (server-side configuration only).

## Error Handling
- Requests from disallowed origins should not receive CORS headers.
- Preflight requests from disallowed origins should be rejected by CORS middleware.

## Security Rationale
- Allowlist stays minimal and explicit to prevent cross-origin data exposure.
- Localhost is explicitly allowed to unblock development, with no wildcard origins.
