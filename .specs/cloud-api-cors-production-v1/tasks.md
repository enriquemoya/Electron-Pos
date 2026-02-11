 # Tasks: cloud-api CORS production v1

 ## Phase 1 - Spec Audit
 - Validate requirements against governance rules.
 - Confirm allowed origins and headers match constraints.

## Phase 2 - Implementation
- Add apps/cloud-api/src/config/cors.ts with environment-aware allowlist.
- Apply CORS middleware at cloud-api entry point before routes.
- Ensure OPTIONS requests short-circuit and set Access-Control-Max-Age.
- Replace environment branching with a single explicit allowlist.

## Phase 3 - Implementation Audit
- Verify CORS is applied before routes.
- Verify production vs development allowlists.
- Verify no wildcard origins and no dynamic reflection.
- Verify no changes to auth, routes, or response shapes.
