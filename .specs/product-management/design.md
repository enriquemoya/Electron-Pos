# Design: Product Management

## UI
- Products route shows toolbar, create form, product table, and import summary.
- Search and category filtering are in-memory only.

## Data Flow
- Load products + inventory via IPC on screen load.
- Manual create calls IPC to persist product, then updates stock via IPC.
- Import uses Excel parsing in renderer, then applies results via IPC:
  - create/update products
  - update inventory stock by delta
- Export uses current in-memory view (from IPC) to generate Excel.

## Error Handling
- No blocking alerts; errors shown inline via summary.

## Localization
- All UI strings defined in local i18n dictionary.