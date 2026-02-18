# Koyote POS (Electron + Next.js)

Local-first POS for a TCG store. Electron shell + Next.js renderer, SQLite as source of truth, IPC-only persistence.

## Prerequisites

- Node.js (use the version you already run in this repo)
- npm
- Windows Build Tools (if native modules are rebuilt)

## Install

```powershell
npm install
```

## Environment

Create a `.env` file in the repo root. Example (replace values as needed):

```env
# SQLite
DB_PATH=C:\Users\<user>\AppData\Roaming\KoyotePOS\koyote.db

# Electron dev
ELECTRON_START_URL=http://localhost:3000

# Google Drive (optional)
DRIVE_CLIENT_ID=your-client-id
DRIVE_CLIENT_SECRET=your-client-secret
DRIVE_SCOPES=https://www.googleapis.com/auth/drive.file
DRIVE_FILE_NAME=productos-inventario.xlsx

# Backups
BACKUP_RETENTION=10
```

## Development

Run the web app:

```powershell
npm run dev -w apps/web
```

Run the Electron app (desktop):

```powershell
npm run dev:desktop
```

## Build

Build the web app:

```powershell
npm run build -w apps/web
```

Build the Electron app:

```powershell
npm run build -w apps/desktop
```

## Common commands

```powershell
# Workspaces overview
npm run -ws

# Rebuild native deps for Electron (if needed)
npx electron-rebuild -f -w better-sqlite3 -v 30.0.9 --module-dir .
```

## IPC usage examples

Renderer (Next.js) uses the preload bridge. Example calls:

```ts
// List products (paged)
const result = await window.api.products.listPaged({ page: 1, pageSize: 20 });

// Create a sale
await window.api.sales.createSale(sale);

// Get dashboard summary
const summary = await window.api.dashboard.getSummary(new Date().toLocaleDateString("en-CA"));
```

## Data safety (backups)

- Backups live under the app data folder in `backups/`.
- Restore is available only on recovery routes.
- If DB cannot be opened, the app routes to `/error/db`.

## Project structure

```
/
  /apps
    /web        Next.js UI
    /desktop    Electron shell
  /packages
    /core       Domain logic (pure)
    /db         SQLite repositories
  /.memory-bank
  /.specs
```

## Notes

- Renderer never touches SQLite directly.
- All persistence goes through IPC.
- Specs are ASCII-only by governance rules.

## DanimeZone Deployment (VPS + Docker)

This repo also deploys the `danimezone-site` and `danimezone-api` services to a VPS using Docker + Traefik.

### Files

- `docker-compose.prod.yml` runs the app services only (site + api).
- `docker-compose.traefik.yml` runs Traefik only (reverse proxy + SSL).
- `deploy/.env` holds production env variables (copied from GitHub Secrets).

### Workflow

GitHub Actions workflow: `.github/workflows/deploy.yml`

Behavior:

- Builds and pushes images to GHCR on `main`.
- SSH deploy on VPS.
- Recreates `danimezone-site` and `danimezone-api` only.
- Traefik is not restarted on every deploy.

### Traefik (Cloudflare Origin SSL)

Traefik is a separate stack and does not use Let's Encrypt/ACME.
Cloudflare handles public certificates, and Traefik serves origin HTTPS
with a Cloudflare Origin Certificate.

1. In Cloudflare, create an Origin Certificate for:
   - `danimezone.com`
   - `*.danimezone.com`
2. Save files on VPS:
   - `deploy/traefik/certs/origin.pem`
   - `deploy/traefik/certs/origin.key`
3. Set Cloudflare SSL/TLS mode to `Full (strict)`.
4. Set DNS records (proxied/orange cloud):
   - `A @ -> 187.77.17.4`
   - `CNAME www -> @`
   - `A api -> 187.77.17.4`
5. Ensure VPS firewall allows ports `80` and `443`.

Initial setup on VPS:

```bash
cd /docker/electron-pos
docker compose -f docker-compose.traefik.yml --env-file deploy/.env up -d
```

Local Traefik (HTTP-only, no Cloudflare cert files required):

```bash
docker compose -f docker-compose.traefik.yml -f docker-compose.traefik.local.yml --env-file deploy/.env up -d
```

Normal app deploy (no Traefik restart):

```bash
cd /docker/electron-pos
docker compose -f docker-compose.prod.yml --env-file deploy/.env up -d danimezone-site danimezone-api
```

### Force Traefik Update (Optional)

GitHub Secret `FORCE_TRAEFIK_UPDATE` controls Traefik updates.

- Set to `true` to force recreate Traefik on next deploy.
- Omit or set `false` to skip.

### Production verification checklist

```bash
curl -I https://danimezone.com
curl -I https://api.danimezone.com/__health
```

Cloudflare dashboard should show SSL mode `Full (strict)`.

### Required GitHub Secrets

- `VPS_HOST`
- `VPS_USER`
- `VPS_PORT`
- `VPS_SSH_KEY`
- `DEPLOY_PATH`
- `DANIMEZONE_ENV`
- `GHCR_TOKEN`
- `GIT_TOKEN`
- `FORCE_TRAEFIK_UPDATE` (optional)
