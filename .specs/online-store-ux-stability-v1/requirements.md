# Requirements: Online Store UX Stability v1

## Problem statement
Multiple UI/UX friction points in the online store reduce reliability and
confidence. Images fail on external URLs, drawers do not always close on
navigation, some admin/detail pages lack a consistent back action, and key
flows do not provide success/error feedback.

## Goals
- Ensure product imagery supports external URLs with reliable fallbacks.
- Make Sheet/Drawer components close predictably on navigation.
- Provide a consistent BackButton on detail pages and listing pages for admin and client.
- Add localized success/error toasts for key actions using shadcn Sonner.
- Add admin quick access in the user dropdown, gated by role.
- Add cancel/close affordances for admin modals.

## Non-goals
- No Cloud API changes.
- No schema or data changes.
- No auth/authorization logic changes.
- No route or API contract changes.
- No POS/Electron changes.

## Constraints
- Online-store only.
- Must use next-intl for all user-visible strings.
- Follow existing Next.js App Router and shadcn/tailwind patterns.
- No changes to business logic or API contracts.

## Assumptions
- Product image URLs can be external (non-local) and may fail to load.
- Existing sheets/drawers use shadcn Sheet components.
- User role is available in the online store session/context.

## Out of scope
- New endpoints or proxy services.
- Changes to backend CORS/auth.
- Changes to checkout logic beyond UI feedback.

## UX requirements
- ProductImage must use <img> for external URLs, next/image for local assets,
  always with a placeholder fallback and localized alt text.
- Sheets/drawers must close when navigation occurs from within them.
- BackButton must use router.back with a fallback href when history is empty.
- BackButton must appear on admin list pages and client listing pages.
- Success/error toasts must appear for:
  - add to cart
  - admin save
  - profile save
  - order state change
  - checkout revalidation
- Toasts must use shadcn Sonner (Radix Sonner).
- Admin Dashboard link appears in the user dropdown only for ADMIN role.
- Admin dialogs must include a cancel/close button.

## Error handling
- Image loading failures must fall back to the placeholder without layout shift.
- Toasts should reflect success or error state based on existing outcomes.
- Sheet/drawer closing must not break existing navigation.

## i18n
- All new labels, alt text, and toast messages must be localized with next-intl.
- Do not introduce hardcoded strings in UI.
