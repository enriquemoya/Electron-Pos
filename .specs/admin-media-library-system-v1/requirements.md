# admin-media-library-system-v1 - Requirements

## Goal

Eliminate manual image URL entry in admin flows by introducing a reusable Media Library selection system backed by existing CDN media infrastructure.

## Objective

- Replace raw image URL inputs with internal media library selection.
- Improve admin UX for upload and image selection.
- Enforce CDN-only media usage across scoped admin surfaces.
- Preserve additive-only guarantees.
- Avoid breaking API changes.

## Scope

This spec extends:
- `cdn-media-system-v1`
- `blog-system-weapon-v1`

Backend (`cloud-api`):
- Add `GET /admin/media`
- Add `DELETE /admin/media/:key`

Frontend (`online-store`):
- Add reusable admin media components under `components/admin/media/`
- Integrate media selector into:
  - Blog cover image
  - Tiptap image insertion
  - Product image
  - Category image
- Remove manual URL input fields for those surfaces

## Non-Goals

- No direct client to R2 upload
- No schema changes
- No migration changes
- No changes to existing checkout, payment, or order domains
- No public media browsing feature

## Constraints

- Additive-only API behavior
- No breaking API contract changes
- Existing upload endpoint behavior remains intact
- CDN-only media URLs are mandatory in admin selection flows
- URL inputs for images must be removed from scoped admin forms

## i18n Impact

- New admin media library labels are required in `es-MX.json` and `en-US.json`.
- No new customer-facing copy is required.

## API Requirements

### GET /admin/media

Admin-only paginated listing endpoint.

Query params:
- `folder` (optional): `products | categories | blog | banners`
- `page` (optional, default `1`)
- `pageSize` (optional, default `20`, max `50`)

Response fields (additive):
- `items[]` with media metadata needed for selector UI
- `page`
- `pageSize`
- `total`
- `hasMore`

### DELETE /admin/media/:key

Admin-only delete endpoint.

Behavior:
- Deletes object from R2 by key
- Logs actor context through centralized logger
- Returns stable success payload

## Security Requirements

- All media endpoints MUST be admin-protected.
- CDN-only URL enforcement is mandatory.
- Folder allowlist MUST be enforced server-side.
- No direct client-to-R2 upload is permitted.
- Raw external image URLs outside configured CDN MUST be rejected.
- No R2 credentials MUST be exposed to frontend.
- No public bucket write is allowed.
- Delete action MUST include actor context in server logs.
- Rate-limit consideration MUST be documented for write endpoints.
- Stable error codes are required for all failure paths.

Stable error codes:
- `MEDIA_INVALID_TYPE`
- `MEDIA_TOO_LARGE`
- `MEDIA_FOLDER_NOT_ALLOWED`
- `MEDIA_UPLOAD_FAILED`
- `MEDIA_UNAUTHORIZED`
- `MEDIA_INVALID_KEY`
- `MEDIA_NOT_FOUND`
- `MEDIA_DELETE_FAILED`
- `MEDIA_RATE_LIMITED`
- `BLOG_MEDIA_NOT_CDN`

All errors MUST use stable error codes. No ad-hoc string errors are permitted.

## Performance Constraints

- Media listing must be paginated
- Maximum `pageSize` is `50`
- Sorting is `uploadedAt DESC`
- No N+1 query pattern for list metadata
- No unbounded full bucket listing in request path

## UX Requirements

- No raw URL image input in scoped admin forms
- Upload and select happen in one media library flow
- Selected media returns CDN URL and auto-populates target field
- Tiptap image insert uses media selector, not manual URL prompt
- Media selector is reusable across blog, product, and category forms

## Environment Isolation

- All media keys MUST be prefixed with `APP_ENV`.
- No cross-environment object collision is allowed.
- Production and staging buckets MUST remain logically isolated.
- CDN URLs MUST include environment prefix.
- This spec does not alter `APP_ENV` semantics defined in `cdn-media-system-v1`.

## State Invariants

- This spec does not introduce a state machine.
- No blog status transitions are modified.
- No refund or media state transitions are modified.
- No database schema changes are introduced.

## Acceptance Criteria

1. No scoped admin form allows raw image URL entry.
2. Selecting media auto-fills a CDN URL.
3. Inline upload works from media library dialog.
4. Delete removes object from R2 using admin-only endpoint.
5. Blog editor cannot insert non-CDN image URLs.
6. Cloud-api and online-store builds pass.
7. No `console.*` in runtime code paths.
8. Spec documents are ASCII-only and English-only.
9. Spec audit returns READY.
