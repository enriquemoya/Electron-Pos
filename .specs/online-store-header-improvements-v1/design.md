# Design: Online Store Header Improvements v1

## High-level architecture
- UI-only updates to the shared header/navigation component in the online-store.
- Add a logo asset to the shared public assets directory and reuse it in the header.
- Update the favicon to use the same logo asset.
- Desktop search uses an icon trigger that expands into an overlay input within the header.

## Data flow
- No new data flow. Uses existing navigation state and client-side menu state.

## Data model
- No data model changes.

## API / IPC contracts
- No API, IPC, or backend changes.

## State ownership
- Menu open/close state remains in the header/menu component.
- Ensure state updates are deterministic and always close on user intent.

## Assets
- Add logo image to shared assets directory used for hero assets.
- Source logo file provided at:
  - /Users/enriquemoya/Documents/danime_zone_all_designs/A_digital_illustration_of_a_black_raven_features_a.png
- Add favicon file using provided ico at:
  - /Users/enriquemoya/Downloads/A_digital_illustration_of_a_black_raven_features_a.ico

## Behavior changes
- Mobile hamburger menu must open and close reliably.
- Header hides cart text label while keeping icon visible and accessible.
- Desktop header layout must remain visually unchanged.
- Header logo uses the shared asset and should not affect layout stability.
- Reduce horizontal padding and expand header content width on desktop while remaining aligned to the grid.
- Desktop search icon expands into a full-width overlay input in the header.
- Overlay is dismissible via ESC, close icon, or clicking outside.
- Overlay should not cause layout shift.
- Make the logo image and brand text relatively positioned in the header using flex and justify-start.
- Logo image width: 5.5rem on desktop; 35px on mobile (use rem sizing); height auto.
- Remove fixed top/left positioning in favor of layout spacing.
- Brand text positioned to align with the logo using flex layout.

## Error and edge cases
- Missing logo asset should not break layout; use existing fallback styling.
- Menu should close on navigation and on explicit close action.
- Avoid focus traps or stuck overlays when toggling quickly.

## i18n and accessibility
- Preserve existing localized labels and aria attributes.
- If cart label text is removed visually on mobile, keep accessibility labels intact.
- Favicon change does not require localization.
- Search overlay controls must be localized and accessible (button labels, aria attributes).
