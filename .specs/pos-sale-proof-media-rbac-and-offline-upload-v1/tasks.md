# Tasks

## Phase 1 - Spec
- Create requirements.md, design.md, tasks.md.
- Run strict spec audit and resolve blockers.

## Phase 2 - Cloud API
- Add proof error codes to taxonomy.
- Add Prisma model/migration for proof metadata (if missing).
- Add terminal-auth upload endpoint `POST /pos/media/proofs/upload`.
- Add admin endpoints `GET /admin/media/proofs` and `GET /admin/media/proofs/:id`.
- Add rate limits for proof upload and proof listing.
- Ensure controller/use-case/repository/storage layering.

## Phase 3 - Desktop POS
- Add proof local storage service in controlled app directory.
- Add immediate upload attempt in proof attach flows.
- Enqueue `PROOF_UPLOAD` journal events on failure.
- Add retry worker on startup and every 30 minutes.
- Delete local proof files after confirmed upload and local mapping persistence.

## Phase 4 - Online-store Admin UI
- Add admin proof browsing page with table, pagination, branch filter, and detail view.
- Add API route proxies for admin proof list/detail.
- Add i18n keys for ES and EN.

## Phase 5 - Validation
- Run build gates:
  - `npm run build -w apps/cloud-api`
  - `npm run build -w apps/online-store`
  - `npm run build -w apps/desktop`
  - `npm run build -w apps/web`
- Run governance:
  - `npm run gov:spec:audit -- "pos-sale-proof-media-rbac-and-offline-upload-v1"`
  - `npm run gov:impl:audit -- "pos-sale-proof-media-rbac-and-offline-upload-v1"`
- Execute runtime checks:
  - POS online upload returns CDN URL
  - POS offline upload queues and retries
  - Admin proof list/detail enforces RBAC

## Runtime Curl Checks
- POS upload:
  - `curl -X POST -H "Authorization: Bearer <TERMINAL_TOKEN>" -F "file=@proof.jpg" -F "saleId=<sale-id>" https://<api>/pos/media/proofs/upload`
- Admin list:
  - `curl -H "Authorization: Bearer <ADMIN_JWT>" https://<api>/admin/media/proofs?page=1&pageSize=20`
- Admin detail:
  - `curl -H "Authorization: Bearer <ADMIN_JWT>" https://<api>/admin/media/proofs/<proof-id>`
