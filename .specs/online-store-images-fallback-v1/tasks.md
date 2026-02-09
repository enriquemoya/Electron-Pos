# Tasks: Online Store Images Fallback v1

## Phase 1: Assets and i18n
1. Add `product_placeholder.png` to the online-store public assets directory.
2. Add localized alt text string(s) for the placeholder in next-intl messages.

## Phase 2: Catalog fallback
1. Update catalog card image rendering to use the placeholder when image URL is
   missing or fails to load.
2. Ensure layout dimensions match existing design to avoid layout shifts.

## Phase 3: PDP fallback
1. Update PDP hero/gallery image rendering to use the placeholder when image
   URL is missing or fails to load.
2. Ensure fallback uses localized alt text and preserves existing layout.

## Phase 4: QA and regression checks
1. Verify catalog with missing images renders placeholder without errors.
2. Verify PDP with missing images renders placeholder without errors.
3. Confirm i18n coverage for fallback alt text (es/en).
