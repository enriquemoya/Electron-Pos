# Requirements: Online Store Header Improvements v1

## Problem statement
The online store header has usability and branding issues on mobile devices.
The hamburger menu does not open reliably, mobile space usage is suboptimal,
and brand assets (logo and favicon) are not consistently applied.

## Goals
- Fix the mobile hamburger menu so it opens and closes reliably.
- Optimize header space by removing the cart text label while keeping the icon.
- Add the store logo as a reusable asset consistent with existing brand assets.
- Use the store logo as the site favicon.
- Reduce header horizontal padding and expand header content width on desktop.
- Provide an icon-only desktop search trigger that expands into an overlay search input.
- Update header logo layout to match the provided visual reference using relative positioning and flex layout.
- Use a shortened brand name on mobile to optimize spacing.

## Non-goals
- No changes to cart behavior or logic.
- No changes to checkout or authentication.
- No navigation structure redesign beyond fixing the menu behavior.
- No Cloud API or backend changes.

## Constraints
- Online-store only.
- Read-only UI changes only.
- No Cloud API changes.
- No data or schema changes.
- No POS / Electron.
- No cart / checkout / auth logic changes.
- Header/navigation only.
- Header must remain responsive and mobile-first.
- Desktop header layout must remain visually unchanged.
- Mobile header may simplify labels for space optimization.
- Desktop header should use minimal, consistent side padding aligned to the layout grid.
- Header logo and brand text must use relative positioning with flex and justify-start (no fixed top/left offsets).
- Mobile logo size must be reduced to 35px (use rem sizing).
- Use existing UI stack (Next.js App Router, shadcn/ui, Tailwind).
- All assets must live under the shared assets directory, same convention as hero assets.
- i18n must be preserved; do not hardcode strings.
- Default locale is es with URL-only locale switching.

## Assumptions
- Header component exists and is shared across pages.
- Cart icon already exists and is functional.
- Hamburger menu uses a client-side interaction (Sheet / Dialog / Drawer).
 - Logo and brand text can be positioned relatively without breaking layout overlap in the header.

## Out of scope
- Visual rebranding.
- New navigation items.
- Animation redesign beyond fixing broken behavior.

## i18n
- Any user-visible labels added or changed must be localized.
- If a label is removed (mobile cart text), do not introduce new hardcoded text.
- Search overlay controls must use existing or new localized labels (no hardcoded strings).

## Error handling
- Header should not crash if logo asset fails to load; it should degrade gracefully.
- Hamburger menu state must not get stuck; toggling should always close the menu.
- Search overlay must be dismissible (ESC, close action, or clicking outside).
- Search overlay must not cause layout shift when toggling.
- Absolute-positioned logo must not block header interactions.
