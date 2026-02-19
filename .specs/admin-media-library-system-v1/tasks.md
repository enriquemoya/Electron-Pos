# admin-media-library-system-v1 - Tasks

## Phase 1 - Spec

1. Create `requirements.md`, `design.md`, and `tasks.md`.
2. Verify ASCII-only and English-only content.
3. Run strict spec audit.
4. Resolve blockers to READY.

## Phase 2 - Cloud API

1. Add admin route `GET /admin/media`.
2. Add admin route `DELETE /admin/media/:key`.
3. Add query/key validators for listing and delete.
4. Add use case methods for list and delete.
5. Add storage adapter methods for paginated listing and delete by key.
6. Add stable media error mappings and response envelope consistency.
7. Add actor-aware logging for delete operations.
8. Add optional rate-limit middleware for delete write path.

## Phase 3 - Online Store Components

1. Add `media-library-dialog.tsx`.
2. Add `media-grid.tsx`.
3. Add `media-upload-dropzone.tsx`.
4. Add `media-selector.tsx`.
5. Use shadcn primitives for dialog, grid actions, and feedback states.

## Phase 4 - Integrations

1. Replace blog cover image raw URL input with media selector.
2. Replace Tiptap image URL prompt with media selector flow.
3. Replace product image raw URL input with media selector.
4. Replace category image raw URL input with media selector.
5. Ensure selected media writes CDN URL to existing image fields.

## Phase 5 - i18n and UX Hardening

1. Add required admin media labels to `es-MX.json` and `en-US.json`.
2. Ensure no hardcoded admin UI strings in new components.
3. Ensure empty/loading/error states are localized.

## Phase 6 - Validation

1. Run `npm run build -w apps/cloud-api`.
2. Run `npm run build -w apps/online-store`.
3. Run `npm run gov:spec:audit -- "admin-media-library-system-v1"`.
4. Run strict implementation audit after implementation.

## Runtime Verification Checklist

1. Upload image from media dialog and verify CDN URL selection.
2. Select existing image for blog cover and save post.
3. Insert image in Tiptap via media selector and verify CDN URL in content JSON.
4. Delete image from media library and verify object removal in R2.
5. Verify non-admin access to media endpoints is rejected.
6. Verify list pagination (`page`, `pageSize`) and max `50` enforcement.
7. Verify no runtime `console.*` statements in touched paths.

## Acceptance Criteria Checklist

1. Manual image URL inputs are removed from scoped admin forms.
2. Upload and select flow works inline in media dialog.
3. CDN-only URL usage is enforced in blog media insertion flow.
4. Delete operation is admin-only and removes object by key.
5. Error responses use stable codes for media list/delete paths.
6. Cloud-api and online-store builds pass.
7. Spec audit verdict is READY.
