# Tasks: Online Store Cart v1

## Phase 1: Cart state and utilities
1. Create CartProvider (context + reducer) with localStorage persistence.
2. Define cart item model and normalization helpers.
3. Add quantity helpers and availability messaging rules.

## Phase 2: Header + drawer
1. Add cart icon to header with item count badge.
2. Implement cart drawer using shadcn Sheet (full screen on mobile, max-w-md on desktop).
3. Wire drawer open/close from any page.

## Phase 3: Cart page
1. Create /{locale}/cart page with cart list and summary.
2. Add empty state and navigation back to catalog.
3. Ensure accessibility labels and keyboard navigation.

## Phase 4: Add-to-cart entrypoints
1. Add or wire minimal add-to-cart action on PDP.
2. Add compact card controls (quantity input with +/- and icon button).
3. Add add-to-cart on catalog product cards and featured cards (including landing featured grid).
4. Ensure no server-only secrets are used in client components.

## Phase 5: QA and i18n
1. Add all strings to next-intl dictionaries.
2. Verify cart persistence and quantity rules across reloads.
3. Verify behavior for availability unknown / pending sync.
