 # Design: cloud-api CORS production v1

 ## Overview
 Implement a centralized CORS configuration for cloud-api and apply it at
 the application entry point. CORS behavior is environment-aware and uses
 explicit allowlists for origins and headers. No changes to API behavior.

 ## Data Model
 - No database changes.
 - No schema or migration changes.

## Configuration Model
- File: apps/cloud-api/src/config/cors.ts
- Exports:
  - allowedOrigins: string[]
  - corsOptions: structured CORS options object
- Environment:
  - No environment branching for CORS in this version.
  - A single explicit allowlist is used in all environments.

 ## Request Flow
 1) Incoming request hits cloud-api entry point.
 2) CORS middleware runs before all routes.
 3) If Origin is allowed:
    - Set Access-Control-Allow-Origin to that specific origin.
    - Set Access-Control-Allow-Credentials to true.
    - Set Access-Control-Allow-Headers per allowlist.
    - Set Access-Control-Allow-Methods per allowlist.
    - Set Access-Control-Max-Age to 86400 for preflight.
 4) If Origin is not allowed:
    - CORS headers are not set.
    - Preflight fails (blocked by browser).

 ## API Contracts
 - No changes to route paths or response shapes.
 - No changes to auth or shared-secret behavior.

 ## Edge Cases
 - Requests without Origin header:
   - Allowed to proceed (typical for server-to-server).
 - Preflight OPTIONS:
   - Must short-circuit with correct CORS headers for allowed origins.
 - Disallowed origin:
   - No Access-Control-Allow-Origin header.
 - Production deployment:
   - Do not permit localhost origins.

## Security Notes
- No wildcard origins.
- No dynamic reflection beyond explicit allowlist.
- Credentials enabled only for allowed origins.
- Localhost is explicitly allowed by allowlist (single policy).
