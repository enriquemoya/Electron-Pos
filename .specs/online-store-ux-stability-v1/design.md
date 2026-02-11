# Design: Online Store UX Stability v1

## Overview
This change refines online-store UX reliability without altering backend
contracts. It introduces a robust ProductImage abstraction, consistent drawer
close behavior, a reusable BackButton on detail and listing pages, localized
Sonner toasts for critical actions, cancel buttons in admin dialogs, and an
ADMIN-only dashboard shortcut in the user dropdown.

## Architecture impact
- UI-only changes in online-store.
- No API contract changes.
- No auth policy changes.
- No schema changes.

## Components and behavior

### ProductImage
- Input: src (string), altKey (i18n key), fallback placeholder.
- Behavior:
  - If src is external (http/https), render <img>.
  - If src is local asset or static import, render next/image.
  - If src missing or load error, swap to placeholder.
- Localized alt text via next-intl.

### Sheet/Drawer close
- Use SheetClose asChild for navigational links and actions inside sheets.
- Add route-change safety close on cart, mobile-nav, and catalog filters.

### BackButton
- Uses router.back() when history exists.
- Fallback href if history is empty or same-origin back is not possible.
- Added to admin list pages, admin edit pages, order detail pages, product detail
  page, and client listing pages (catalog, orders list).

### Toast feedback
- Use shadcn Sonner (Radix Sonner).
- Localized messages for:
  - add to cart
  - admin save
  - profile save
  - order state change
  - checkout revalidation

### Admin dialog cancel
- Add cancel/close button to admin dialogs that can be dismissed by users.

### Admin quick access
- Add Admin Dashboard link in user dropdown.
- Render only when role === "ADMIN".

## Files to touch (expected)
- apps/online-store/src/components/product-image.tsx (new or refactor)
- apps/online-store/src/components/navigation/cart.tsx
- apps/online-store/src/components/navigation/mobile-nav.tsx
- apps/online-store/src/components/catalog/catalog-filters.tsx
- apps/online-store/src/components/common/back-button.tsx (new)
- admin and detail pages for BackButton placement
- toast call sites in cart/admin/profile/order/checkout flows
- admin dialog components for cancel actions
- i18n message files for new strings

## i18n keys (example)
- product.imageAlt
- navigation.back
- toast.addToCart.success / toast.addToCart.error
- toast.adminSave.success / toast.adminSave.error
- toast.profileSave.success / toast.profileSave.error
- toast.orderState.success / toast.orderState.error
- toast.checkoutRevalidate.success / toast.checkoutRevalidate.error
- navigation.adminDashboard

## Risks
- Inconsistent image sizing if <img> and next/image are not styled identically.
- Missed toast localization if keys are not added to all locales.
- Drawer close behavior must not break existing flows.

## Rollback
- Revert ProductImage changes.
- Remove BackButton component usage.
- Remove toasts and admin dropdown link.
