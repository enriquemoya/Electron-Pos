SPEC: ci-cd-v1

Goal
- Document the current production deployment and CI/CD flow for danimezone-site and danimezone-api.
- Record required environment variables, secrets, and operational steps used today.
- Provide a governance-safe reference for future maintenance without changing runtime code.

Scope
- Online store (danimezone-site) and cloud API (danimezone-api).
- GitHub Actions build and deploy pipeline.
- Docker, Traefik, and VPS runtime topology.
- Required DNS and SSL assumptions.

Non-goals
- No code changes.
- No new features.
- No API contract changes.
- No infrastructure migration beyond documentation.

Constraints
- ASCII-only text.
- English-only governance text.
- Must reflect current implementation and behavior.
- No secrets are embedded in the spec; only names and required presence.
- Online store is read-only; no shared secrets in client components.
- Client-side usage of shared secrets and JWT secrets is not allowed and is not present.

i18n
- No UI changes; no localization updates required.

Error handling
- Document known failure modes and their operational resolutions.
- Focus on deploy pipeline errors and runtime reachability (health endpoints).

Current Production Flow Summary
- Images are built and pushed to GHCR on pushes to main.
- VPS deploy is executed via SSH from GitHub Actions.
- Traefik handles HTTP/HTTPS routing and ACME certificates.
- Services run inside Docker containers with ports 3000 (site) and 4000 (api).

Environment Variables (names only)
- TRAEFIK_EMAIL
- GHCR_OWNER
- NEXT_PUBLIC_API_URL
- NEXT_TELEMETRY_DISABLED
- DATABASE_URL
- CLOUD_SHARED_SECRET
- JWT_SECRET
- ONLINE_STORE_BASE_URL
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- SMTP_FROM
- ENVIROMENT

Required Secrets (GitHub Actions)
- VPS_HOST
- VPS_USER
- VPS_PORT
- VPS_SSH_KEY
- DEPLOY_PATH
- DANIMEZONE_ENV
- GHCR_TOKEN
- GIT_TOKEN

Security Requirement
- Browser-visible environment variables must not contain secrets.
