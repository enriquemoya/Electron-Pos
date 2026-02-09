# Tasks: Online Store Header Improvements v1

## Phase 1: Asset integration
1. Add the provided logo image to the shared assets directory (same convention as hero assets).
2. Add the provided favicon ico to the online-store public assets and wire it in the app metadata.

## Phase 2: Header UX fixes
1. Diagnose and fix hamburger menu open/close reliability on mobile.
2. Ensure menu state closes on navigation and explicit close actions.
3. Reduce header horizontal padding and expand content width on desktop.
4. Remove cart text label across header while preserving icon and accessibility.
5. Replace desktop search input with icon trigger and implement overlay search input.
6. Ensure overlay dismisses via ESC, close icon, and outside click without layout shift.
7. Update logo and brand text to relative positioning with flex layout and responsive sizing.
8. Use mobile short brand name ("Danime") for spacing.

## Phase 3: Mobile spacing adjustment
1. Verify mobile spacing remains optimized with icon-only actions.
2. Preserve accessibility labels and desktop layout unchanged.

## Phase 4: QA and regression checks
1. Verify header layout matches current desktop layout.
2. Verify mobile menu opens and closes reliably across pages.
3. Verify cart icon remains accessible with correct aria labels.
4. Verify favicon displays in browser tabs.
