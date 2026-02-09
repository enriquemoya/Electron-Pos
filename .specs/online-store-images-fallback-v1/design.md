# Design: Online Store Images Fallback v1

## High-level architecture
- UI-only fallback behavior inside online-store components that render product
  imagery (catalog cards and PDP hero/gallery).
- A single shared placeholder asset in the public assets directory.
- Local component logic handles missing or failed image rendering without
  API changes.

## Data flow
1. Component receives product image URL(s) from existing data flow.
2. If URL is missing or empty, render placeholder image.
3. If URL is present but image fails to load, render placeholder image.

## Data model
- Uses existing product image URL fields from current read models.
- No new fields or schema changes.

## API / IPC contracts
- No new API or IPC contracts.
- No changes to Cloud API requests or responses.

## State ownership
- Fallback state is owned by the rendering component.
- No global state required.

## Assets
- Add a shared placeholder image asset named `product_placeholder.png` in the
  online-store public assets location used for static images.
- The same asset is used for catalog cards and PDP hero/gallery.

## Error and edge cases
- Empty or null image URL list.
- Invalid URL that fails to load.
- Slow network image load (should not collapse layout).
- SSR/CSR parity: fallback should render consistently between server and client.

## i18n and accessibility
- Provide localized alt text for the placeholder image.
- If existing alt text uses product name, use a localized fallback string when
  product name is missing.
- Maintain existing focus and keyboard navigation behavior.
