# Design: POS New Sale UI

## Layout
- Left panel: product search input and filtered list.
- Right panel: cart items with quantity controls and totals.
- Bottom bar: total and confirm action.

## Data Flow
- Load products and inventory via IPC on mount.
- Filter products in-memory by name.
- Use core domain helpers for totals.
- Confirm sale calls window.api.sales.createSale and updates inventory via IPC.

## Error Handling
- Prevent empty sale confirmation.
- Inline error messaging only.

## Localization
- All UI strings come from a local es-MX dictionary.
