# admin-media-library-system-v1 - Design

## Architecture Overview

Layering:
- Controller -> Use case -> Repository/Storage adapters
- Validation is isolated from transport handlers
- UI media selection is encapsulated in reusable components

This design reuses existing R2 storage service from `cdn-media-system-v1` and blog CDN policy from `blog-system-weapon-v1`.

## Architecture Flow

Admin Controller
-> Media Library Use Case
-> Repository (if metadata is involved)
-> Storage Adapter (R2 service)

Rules:
- Controllers contain no storage logic.
- Use case contains business rules.
- Repository contains metadata reads and writes only.
- Storage adapter contains R2 logic only.
- No controller-to-storage direct calls are allowed.

## Backend Design

## Controller Flow

1. Admin request enters protected route.
2. Controller validates query/path payload shape.
3. Use case enforces pagination bounds, key policy, and actor context.
4. Repository/storage adapter performs list or delete operation.
5. Controller returns stable response envelope.

## Media Listing Strategy

- Source of truth is media object index from storage layer.
- List operation supports `folder`, `page`, and `pageSize`.
- Query is ordered by uploaded timestamp descending.
- `pageSize` hard-capped at `50`.

If storage provider cannot do strict offset pagination natively, use cursor mapping internally but keep stable paginated response contract.

## Media Delete Strategy

- `DELETE /admin/media/:key` validates key format.
- Allowed key pattern:
  - `<env>/<folder>/<uuid>.webp`
- Delete call is executed against R2 through storage adapter.
- Missing object returns stable `MEDIA_NOT_FOUND`.
- Provider failure returns stable `MEDIA_DELETE_FAILED`.

## Security Design

- Routes mounted under `requireAdmin`.
- Optional write-rate limiting applied to delete endpoint.
- No frontend credential usage.
- Key validation prevents path traversal or arbitrary key deletion.

## Frontend Design

New reusable components:
- `components/admin/media/media-library-dialog.tsx`
- `components/admin/media/media-grid.tsx`
- `components/admin/media/media-upload-dropzone.tsx`
- `components/admin/media/media-selector.tsx`

## Component Responsibilities

- `media-library-dialog`: orchestrates open state, fetch list, upload, select, delete action wiring.
- `media-grid`: renders paginated media cards and selection actions.
- `media-upload-dropzone`: file input and drag-drop upload trigger.
- `media-selector`: compact field-level selector control reusable in forms.

## Integration Targets

- Blog cover image field uses `media-selector`.
- Tiptap image insertion opens media library and inserts selected CDN URL.
- Product image field uses `media-selector`.
- Category image field uses `media-selector`.

Manual URL inputs are removed from these surfaces.

## Error Model

All responses use stable error codes and consistent shape.

Required media codes:
- `MEDIA_UNAUTHORIZED`
- `MEDIA_INVALID_KEY`
- `MEDIA_NOT_FOUND`
- `MEDIA_DELETE_FAILED`
- `MEDIA_RATE_LIMITED`

## Data and Migration Impact

- No Prisma schema changes.
- No migration changes.
- Existing entity image URL fields remain unchanged.

## Performance Considerations

- Server list endpoint is paginated and bounded.
- UI requests list by page and does not preload full library.
- Avoid repeated fetches through local dialog state cache for current page.

## Observability

- Use centralized logger only.
- Log delete success/failure with actor id and key.
- Do not log credentials, tokens, or raw binary data.

## Edge Cases

- Invalid or malformed `key` path on delete.
- Delete non-existing key.
- Upload success but list refresh failure.
- Empty folder result set.
- Large library where only first page is loaded.
