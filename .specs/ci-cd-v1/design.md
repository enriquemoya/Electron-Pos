SPEC: ci-cd-v1

Design Overview
- GitHub Actions builds and pushes Docker images to GHCR.
- VPS deploy step pulls images and restarts containers using docker-compose.prod.yml.
- Traefik is the only service bound to ports 80/443.
- Application services are internal and routed by Traefik via labels.

Data Model
- No new data model changes.
- No schema or migration changes.

Deployment Flow
1) Push to main.
2) Actions build and push:
   - ghcr.io/<GHCR_OWNER>/danimezone-site:latest
   - ghcr.io/<GHCR_OWNER>/danimezone-api:latest
3) Actions SSH into VPS.
4) If DEPLOY_PATH is not a git repo, clone into it.
5) Reset to origin/main.
6) Write deploy/.env from DANIMEZONE_ENV secret.
7) docker login to GHCR using GHCR_TOKEN.
8) docker compose pull + up -d using docker-compose.prod.yml.

Runtime Topology
- Traefik
  - entrypoints: web (80), websecure (443)
  - ACME HTTP-01 challenge
- danimezone-site
  - internal port 3000
  - router: danimezone.com, www.danimezone.com
- danimezone-api
  - internal port 4000
  - router: api.danimezone.com

Security Boundaries
- Only Traefik binds to public ports.
- No wildcard CORS in production.
- Secrets are provided via DANIMEZONE_ENV only.
- Client code must not use shared secrets or JWT secrets.

Edge Cases
- GHCR_OWNER missing: image reference invalid.
- DNS not pointing to VPS: ACME challenge fails.
- DEPLOY_PATH not writable: clone or env write fails.
- Missing PORT in env: service uses default; health still responds but port marked MISSING.
- Missing DATABASE_URL or JWT_SECRET: runtime health may report missing; API may fail or reject auth.

Operational Checks
- API health: https://api.danimezone.com/__health
- Traefik logs for routing and ACME.
