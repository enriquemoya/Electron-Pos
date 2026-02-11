SPEC: ci-cd-v1

Phase 1 - Spec capture
1. Record current CI/CD flow (GHCR build, SSH deploy, compose up).
2. Record runtime topology (Traefik, site, api).
3. Record required environment variables and secrets.

Phase 2 - Spec audit
1. Verify scope is documentation-only.
2. Confirm no new features or code changes are required.
3. Confirm security constraints remain intact.

Phase 3 - Operational validation
1. Ensure health endpoint exists and returns 200.
2. Verify Traefik routing and ACME success on production domains.
3. Validate that deploy pipeline uses main branch only.

Phase 4 - Security remediation (completed)
1. Remove NEXT_PUBLIC_CLOUD_SHARED_SECRET usage from client code.
2. Remove NEXT_PUBLIC_JWT_SECRET usage from client code.
