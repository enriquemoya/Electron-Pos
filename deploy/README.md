# DanimeZone VPS Deployment (Docker + Traefik)

This repo deploys two services on a VPS:
- `danimezone-site` (Next.js online store)
- `danimezone-api` (Express API)

Traefik provides reverse proxy + HTTPS.

## One-time VPS Setup (Ubuntu 24.04)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

Log out/in to apply group changes.

## DNS

Point these to your VPS IP:
- `danimezone.com`
- `www.danimezone.com`
- `api.danimezone.com`

## Environment File

Create `deploy/.env` (same format as `deploy/.env.example`).

Minimal required values:

```bash
TRAEFIK_EMAIL=you@domain.com
GHCR_OWNER=github-username-or-org

NEXT_PUBLIC_API_URL=https://api.danimezone.com
NEXT_PUBLIC_CLOUD_SHARED_SECRET=...
NEXT_PUBLIC_JWT_SECRET=...
NEXT_TELEMETRY_DISABLED=1

DATABASE_URL=...
CLOUD_SHARED_SECRET=...
JWT_SECRET=...
ONLINE_STORE_BASE_URL=https://danimezone.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=DanimeZone <...>
ENVIROMENT=production
```

## Deploy on VPS

```bash
cd /opt/danimezone
docker compose -f docker-compose.prod.yml --env-file deploy/.env pull
docker compose -f docker-compose.prod.yml --env-file deploy/.env up -d
```

## Logs

```bash
docker compose logs -f danimezone-api
docker compose logs -f danimezone-site
docker compose logs -f traefik
```

## Health Check

```bash
curl https://api.danimezone.com/__health
```

## GitHub Actions Deploy

Add secrets:
- `VPS_HOST`
- `VPS_USER`
- `VPS_PORT`
- `VPS_SSH_KEY`
- `DEPLOY_PATH`
- `DANIMEZONE_ENV`
- `GHCR_TOKEN`

On every push to `main`, GitHub Actions will:
1. Build + push images to GHCR
2. Sync repo to VPS
3. Write `deploy/.env` from `DANIMEZONE_ENV`
4. Pull images + restart with `docker-compose.prod.yml`
