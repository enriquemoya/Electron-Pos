# Design: Online Store Menu Close on Navigation v1

## Overview
The fix standardizes menu link behavior by wiring an optional onSelect callback through menu link components and closing relevant menu state before routing.

## Architecture impact
- Frontend only change in online-store navigation components
- No API contract changes
- No data model changes

## Data model
No persistence model changes.
UI state only:
- desktop: open menu id and lock id
- mobile: drawer open boolean and expanded section id

## Component flow
1. User clicks a navigation link inside desktop or mobile menu.
2. Link component invokes optional `onSelect` callback.
3. Parent menu handler closes local menu state immediately.
4. Next.js navigation continues with unchanged href.
5. Existing pathname effect remains fallback for any missed close event.

## Files expected
- `apps/online-store/src/components/navigation/menu-link.tsx`
- `apps/online-store/src/components/navigation/simple-dropdown.tsx`
- `apps/online-store/src/components/navigation/mobile-nav.tsx`
- `apps/online-store/src/components/navigation/main-nav.tsx`

## Edge cases
- Same-route clicks: menu must still close.
- Fast repeated clicks: close handler must be idempotent.
- Mixed hover and click desktop interactions: lock behavior remains intact.

## Accessibility notes
- Preserve existing button/link semantics and keyboard navigation.
- Do not remove escape-to-close behavior in dropdowns.
