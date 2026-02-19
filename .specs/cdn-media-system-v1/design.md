# cdn-media-system-v1 - Design

## Architecture

Admin UI
-> Cloud API
-> R2 Bucket
-> Cloudflare CDN
-> Public Access

Frontend never touches R2 directly.

## R2 Integration

Use AWS S3 SDK v3 (`@aws-sdk/client-s3`) configured with:

- endpoint
- accessKeyId
- secretAccessKey
- region: `auto`

## Key Generation

Key format:

- `${APP_ENV}/${folder}/${uuid}.webp`

Example:

- `prod/products/550e8400-e29b-41d4-a716-446655440000.webp`

Rules:

- UUID v4 required
- No original filename reuse
- Environment prefix enforces isolation between `dev`, `staging`, and `prod`.

## Upload Flow

1. Validate user role (admin)
2. Validate folder enum
3. Validate file size (max 5MB, 5242880 bytes)
4. Validate MIME type (`image/jpeg`, `image/png`, `image/webp`)
5. Process image with sharp:
   - `resize({ width: 1600, withoutEnlargement: true })`
   - `webp({ quality: 85 })`
6. Upload to R2
7. Return CDN URL

All steps are wrapped in explicit error mapping.

## Architecture Flow

Controller -> Use Case -> R2 Storage Service

1. Admin controller receives multipart upload request.
2. Validation middleware enforces:
   - size limit
   - MIME allowlist
   - folder allowlist
3. Use case orchestrates:
   - WebP transform
   - resize to max width
   - key generation with environment prefix
4. Storage service uploads transformed object to R2.
5. Use case returns CDN URL response payload.

Separation of concerns:

- Controller: transport and auth boundary
- Use case: validation orchestration and policy enforcement
- Storage service: R2 upload and URL composition

## Media Service

New module:

- `src/infrastructure/storage/r2-media.service.ts`

Responsibilities:

- Upload
- Key generation
- URL generation
- No business orchestration logic

## API Contract

- `POST /admin/media/upload` (admin only)

Request: multipart form-data

- `file`: binary image
- `folder`: `products | categories | blog | banners`

Response:

- `url`
- `width`
- `height`
- `sizeBytes`

## Error Model

- `MEDIA_INVALID_TYPE`
- `MEDIA_TOO_LARGE`
- `MEDIA_FOLDER_NOT_ALLOWED`
- `MEDIA_UPLOAD_FAILED`

## Invariants

- Every object key includes environment prefix.
- Every stored object is WebP.
- No stored object exceeds 1600px width.
- No admin UUID is exposed in response payload.
- No direct R2 URL is returned.
- CDN URL is composed from `MEDIA_CDN_BASE_URL`.

## Security Considerations

- Admin upload endpoint is protected by auth guard.
- Optional rate limiting middleware should be considered at infra layer.
- Rate limiting is documented in v1 but not mandated for implementation.

## Observability

Log only:

- upload success
- upload failure
- processing failure
- size metadata

Do not log:

- file binary
- credentials

## Edge Cases

- Missing file in multipart request
- Unsupported mime type
- Oversized upload
- Invalid folder value
- R2 temporary outage
- APP_ENV unset (fallback to `dev`)

## Future Extensions

Reserved (not in v1):

- Signed upload URLs
- Background optimization
- Variants (`thumbnail`, `medium`, `large`)
- Video support
