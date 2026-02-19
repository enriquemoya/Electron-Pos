# cdn-media-system-v1 - Requirements

## Goal

Introduce a production-grade media storage system using Cloudflare R2 and CDN,
with backend-controlled uploads, environment isolation, image optimization,
and zero direct public write access.

## Scope

- Cloud API:
  - Secure admin-only upload endpoint
  - R2 integration (S3 compatible)
  - Automatic image transformation (resize and WebP)
  - Deterministic key structure with environment prefix
  - Stable error modeling
  - Additive-only behavior (no breaking changes)
- Data:
  - No schema change required
  - Image URLs remain simple string fields in existing entities
- Online Store:
  - Continue consuming image URLs returned by API
  - No direct R2 access from frontend

## Non-Goals

- No client-side uploads
- No direct browser-to-R2 signed uploads
- No image editing UI
- No legacy image migration in this version

## Constraints

- Additive-only API behavior
- No Prisma schema or migration changes
- No frontend direct credentials or direct R2 writes
- No breaking API contract changes

## i18n Impact

- No new user-facing copy is introduced.
- Endpoint is admin-only.
- No new frontend strings are required.
- Therefore, no i18n changes are required.

## Environment Isolation

All uploaded files MUST be prefixed by environment:

- `prod/`
- `staging/`
- `dev/`

Environment is derived from `APP_ENV`.

`APP_ENV` prefix guarantees key isolation across `dev`, `staging`, and `prod`.
No cross-environment key collision is possible.

## Storage Structure

- `<env>/products/`
- `<env>/categories/`
- `<env>/blog/`
- `<env>/banners/`

Example:

- `prod/products/charizard-123.webp`

## CDN

Public access via:

- `https://cdn.danimezone.com/<env>/...`

Cloudflare will cache at edge.
Origin access is private R2 only.

## Upload Capabilities

Admin-only endpoint:

- `POST /admin/media/upload`

Multipart form-data:

- `file` (required)
- `folder` (required): `products | categories | blog | banners`

## Image Processing Requirements

All images MUST:

1. Be validated for MIME type.
2. Be resized if width > 1600px.
3. Be converted to WebP.
4. Use quality 80-85.
5. Strip metadata.

Library:

- `sharp`

## Size Limits

- Max original file size: 5MB
- Max output width: 1600px
- Height proportional

## Security Requirements

- Endpoint requires admin role.
- No direct client upload is allowed.
- Folder allowlist is enforced (`products`, `categories`, `blog`, `banners`).
- Object keys use randomized UUID values.
- EXIF metadata is removed by image re-encode.
- Maximum file size is enforced.
- MIME allowlist is enforced.
- No R2 credentials exposed to frontend.
- R2 credentials exist only in backend runtime environment.
- No public write access.
- Content-Type must be validated.
- Reject SVG in v1.

## Response Contract

Response (additive):

```json
{
  "url": "https://cdn.danimezone.com/prod/products/file.webp",
  "width": 1200,
  "height": 800,
  "sizeBytes": 123456
}
```

## Error Handling

Stable error codes:

- `MEDIA_INVALID_TYPE`
- `MEDIA_TOO_LARGE`
- `MEDIA_FOLDER_NOT_ALLOWED`
- `MEDIA_UPLOAD_FAILED`

## Performance Constraints

- Maximum input file size is 5MB.
- Maximum output image width is 1600px.
- Resize occurs before upload.
- WebP re-encode is required for compression.
- Upload is synchronous and bounded by file size constraints.
- Sharp processing must run with memory-safe limits.
- R2 object size after transform must be less than or equal to original size.

## Caching Rules

Cloudflare edge:

- Cache everything
- Edge TTL: 1 month
- Browser TTL: 7 days

## Acceptance Criteria

1. Upload works in prod and staging independently.
2. Images are stored with env prefix.
3. Images are always stored as WebP.
4. Images wider than 1600px are resized.
5. Admin-only access is enforced.
6. Curl upload test succeeds.
7. Returned URL is accessible through CDN.
8. Returned object format is WebP.
9. EXIF metadata is removed.
10. Image width does not exceed 1600px.
11. No schema changes and no migrations are required.
12. Builds pass for cloud-api and online-store.
13. Spec audit returns READY.
