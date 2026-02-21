# pos-sale-proof-media-rbac-and-offline-upload-v1

## Objective
Upgrade POS sale proof handling to a cloud-first R2 pipeline with strict RBAC, while preserving offline operation with local retry buffering.

## Scope
- apps/cloud-api
- apps/desktop
- apps/online-store (admin proof browsing only)
- data layer (Prisma additive changes only if required)

## Non-Goals
- No catalog sync contract changes.
- No redesign of core sales domain beyond proof attachment metadata.
- No Google Drive integration.
- No public proof listing for non-admin users.

## Actors and Roles
- Terminal device: uploads sale proofs through terminal-auth endpoints.
- Branch: owns terminal-scoped proof uploads.
- Admin: can list and inspect proof files globally with optional branch filters.
- Employee: can attach/upload proofs via POS sale flow, cannot enumerate global proofs.

## Functional Requirements
1. POS sale flow supports attaching zero or many proof files.
2. POS attempts immediate cloud upload for each proof.
3. If upload fails, POS stores local file in controlled app storage and enqueues a persisted retry job.
4. Retry worker runs on startup and every 30 minutes.
5. On successful retry, POS persists remote mapping and deletes local file.
6. Cloud API provides terminal-auth endpoint `POST /pos/media/proofs/upload`.
7. Cloud API provides admin endpoints:
   - `GET /admin/media/proofs`
   - `GET /admin/media/proofs/:id`
8. Admin listing supports branch, query, date range, pagination filters.
9. Employee access to global proof listing is forbidden.

## Data Model
If proofs are not modeled, add an additive model:
- `ProofMedia`: id, branchId, terminalId, saleId nullable, objectKey, cdnUrl, mime, sizeBytes, width nullable, height nullable, createdAt.
Indexes:
- `(branchId, createdAt desc)`
- `(saleId)`
- `(terminalId, createdAt desc)`

## Sync Semantics and Idempotency
- POS delivery is at-least-once.
- Cloud storage effect must be exactly-once per upload request key.
- Local proof file is deleted only after cloud confirms upload and local metadata is updated.

## Conflict Rules
- Terminal branch identity from token is authoritative.
- Upload metadata branchId must always match token branchId.
- Global proof list is admin-only; terminal role cannot access list semantics.

## Security
- Terminal auth required for POS proof upload endpoint.
- Admin auth required for proof list and proof detail endpoints.
- R2 credentials live only in cloud-api.
- No direct client bucket writes.
- Server-side MIME and size validation is mandatory.
- Server-side folder/key allowlist is mandatory.
- Proof keys must be random and unguessable.
- Rate limiting is required on POS upload and admin proof listing.

## Performance Constraints
- Admin proof list is paginated.
- Max page size is capped server-side.
- Listing queries use indexed order by `createdAt desc`.
- POS retry batch processing is bounded per run.

## Error Model (Stable Codes)
- `PROOF_INVALID_TYPE`
- `PROOF_TOO_LARGE`
- `PROOF_UPLOAD_FAILED`
- `PROOF_NOT_AUTHORIZED`
- `PROOF_NOT_FOUND`
- `PROOF_RATE_LIMITED`

## i18n Impact
- Online-store admin proof page strings must exist in `es-MX` and `en-US`.
- Desktop user-visible proof upload states must remain localized if i18n is already present.

## Acceptance Criteria
1. Online proof attach returns CDN URL and removes local temp file.
2. Offline proof attach stores local file and persisted retry job.
3. Retry worker uploads queued proofs and deletes local file on success.
4. Admin list/detail works with pagination and branch filter.
5. Employee cannot access admin proof browsing endpoints.
6. Upload endpoint enforces MIME and size limits.
7. Rate limiting returns stable proof error code.
8. Build gates pass:
   - `npm run build -w apps/cloud-api`
   - `npm run build -w apps/online-store`
   - `npm run build -w apps/desktop`
   - `npm run build -w apps/web`
9. Governance gates pass:
   - `npm run gov:spec:audit -- "pos-sale-proof-media-rbac-and-offline-upload-v1"`
   - `npm run gov:impl:audit -- "pos-sale-proof-media-rbac-and-offline-upload-v1"`

## Spec Audit Command
`npm run gov:spec:audit -- "pos-sale-proof-media-rbac-and-offline-upload-v1"`
