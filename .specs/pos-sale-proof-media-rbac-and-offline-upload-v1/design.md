# Design

## Architecture Flow
Cloud API chain:
Controller -> Use Case -> Repository -> Storage (R2 service)

Desktop chain:
IPC handler -> Local SQLite repository -> Queue scheduler -> Cloud client -> Local cleanup

Online-store chain:
Page -> Admin table/filter component -> Next route handler -> Cloud API admin endpoint

## Cloud API Design
- Add terminal-auth proof upload controller handler.
- Add admin proof list/detail handlers with admin auth.
- Reuse R2 media service for object write/delete and URL composition.
- Add proof metadata persistence repository in Prisma.

## Endpoint Contracts
- `POST /pos/media/proofs/upload`
  - Auth: terminal bearer token.
  - Input: multipart file + optional `saleId`.
  - Output: `{ id, url, key, sizeBytes, mime, width, height, createdAt }`.
- `GET /admin/media/proofs`
  - Auth: admin JWT.
  - Query: `branchId`, `q`, `from`, `to`, `page`, `pageSize`.
  - Output: paginated proof metadata.
- `GET /admin/media/proofs/:id`
  - Auth: admin JWT.
  - Output: single proof metadata.

## Desktop Offline Upload Design
1. POS save proof to local controlled path.
2. POS attempts immediate upload.
3. On failure enqueue `PROOF_UPLOAD` event in `sync_journal` with local file path and metadata.
4. Retry worker runs on startup and every 30 minutes.
5. On success:
   - update sale proof reference to CDN URL if saleId exists
   - mark event synced
   - delete local file

## RBAC Rules
- Terminal endpoint accepts terminal auth only.
- Admin endpoints accept admin auth only.
- No employee-facing endpoint can list proofs globally.

## Storage Rules
- Key format: `<env>/proofs/<uuid>.<ext or webp>`.
- Image files are re-encoded to webp where applicable.
- PDF files remain PDF.
- EXIF metadata is stripped for image transformations.

## Error Handling
- All proof handlers must return stable codes from centralized error taxonomy.
- Rate-limited responses return `PROOF_RATE_LIMITED`.
- Missing proofs return `PROOF_NOT_FOUND`.
- Unauthorized access returns `PROOF_NOT_AUTHORIZED`.

## Security Controls
- Validate MIME allowlist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
- Validate max upload size.
- Reject invalid folder and malformed keys.
- Never expose R2 credentials to desktop renderer or online-store client components.

## Performance
- Admin listing is server-paginated with max page size cap.
- Retry worker processes bounded event batches.
- Proof detail lookups use indexed `id`.

## Observability
- Log upload success/failure with terminalId, branchId, proofId, and stable code.
- Log retry attempts and terminal queue metrics.
