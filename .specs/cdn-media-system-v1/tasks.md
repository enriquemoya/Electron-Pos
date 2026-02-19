# cdn-media-system-v1 - Tasks

## Phase 1 - Spec

- Create `requirements.md`
- Create `design.md`
- Create `tasks.md`
- Run strict spec audit
- Resolve blockers to READY

## Phase 2 - Cloud API Implementation

- Install `sharp`
- Install `@aws-sdk/client-s3`
- Install multipart middleware
- Create `r2-media.service.ts`
- Create media use case
- Create media controller
- Add admin route `POST /admin/media/upload`
- Add request validation and folder enum
- Add stable media error codes

## Phase 3 - Security

- Verify admin role middleware enforcement
- Validate folder enum
- Validate MIME allowlist
- Validate max file size (5MB)
- Reject SVG

## Phase 4 - Functional Verification

- Upload JPEG (success)
- Upload PNG (success)
- Upload WebP (success)
- Upload oversized file (reject)
- Upload non-image file (reject)
- Verify output format is WebP
- Verify width <= 1600
- Verify URL uses CDN domain with env prefix

## Phase 5 - Deploy Readiness

- Add required R2 env variables
- Add CDN base URL env variable
- Verify production and staging environment prefixes

## Phase 6 - Governance Validation

- Run strict spec audit
- Run cloud-api build
- Run strict implementation audit
- Produce final SAFE or NOT SAFE verdict

## Runtime Verification Checklist

- Execute curl upload against `POST /admin/media/upload` with admin token.
- Verify response URL starts with `https://cdn.danimezone.com/<env>/`.
- Fetch returned URL and confirm object is reachable.
- Verify stored object format is WebP.
- Verify image width is `<= 1600`.
- Verify EXIF metadata is absent.

## Acceptance Criteria Checklist

- Spec audit verdict is READY.
- Implementation audit verdict is SAFE.
- No schema changes are introduced.
- No migrations are required.
- Cloud-api and online-store builds pass.
