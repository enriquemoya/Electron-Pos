# Requirements: Online Store Images Fallback v1

## Problem statement
Product imagery can be missing, invalid, or fail to load. The online store
needs a consistent, branded fallback image and UX behavior so layouts remain
stable and users are not presented with broken image UI.

## Goals
- Provide a consistent fallback image for missing or failed product images.
- Preserve layout stability in catalog cards and the product detail hero area.
- Keep behavior read-only and UI-only (no data or API changes).
- Ensure all user-visible text related to fallback is localized.

## Non-goals
- No changes to Cloud API or data schema.
- No image processing, resizing, or upload flows.
- No new cart, checkout, or auth behavior.
- No SEO changes beyond existing metadata patterns.

## Constraints
- Online-store only.
- Read-only UI behavior only.
- No Cloud API changes.
- No data or schema changes.
- No POS / Electron.
- No cart / checkout / auth.
- Follow existing Next.js App Router and shadcn/tailwind patterns.
- All user-visible strings must use next-intl.
- Default locale is es, URL-only locale switching.

## Assumptions
- Product image URLs may be missing, empty, or invalid.
- Existing UI already renders product images in catalog and PDP.

## Out of scope
- New endpoints or query parameters.
- Backfilling missing product image data.
- Admin tooling for image management.

## i18n
- Fallback image alt text must be localized using next-intl.
- Any user-visible labels added for fallback must be localized.

## Error handling
- If an image fails to load, the fallback image is displayed.
- If the product has no image, the fallback image is displayed.
- Fallback behavior must not crash rendering or cause layout shifts.
