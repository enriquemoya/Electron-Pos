# Tasks: Online Store UX Stability v1

## Plan
1. Discovery and spec audit.
2. Implement ProductImage abstraction for external/local URLs with fallback.
3. Update sheets/drawers to close on navigation and on route changes.
4. Add BackButton component and place it on detail and listing pages.
5. Replace toast system with shadcn Sonner and add localized toasts for critical actions.
6. Add ADMIN-only dashboard link in user dropdown.
7. Add cancel/close button to admin dialogs.
8. Update i18n messages and verify all locales.
9. Run implementation audit.

## Task breakdown
- T1: Implement ProductImage abstraction and replace existing usages.
- T2: Add SheetClose asChild and route-change close logic.
- T3: Add BackButton component and wire into listing and detail pages.
- T4: Replace toast system with Sonner and add feedback at required action points.
- T5: Add admin dashboard link in user dropdown (role gated).
- T6: Add cancel buttons to admin dialogs.
- T7: Add i18n keys to locale files.
- T8: Impl-audit and fix gaps.
