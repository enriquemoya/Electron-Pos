# SPEC: Product Management

## Goal
Provide a local-first product and inventory workspace for a TCG store with Excel import/export.

## Scope
- List products with search and category filter.
- Create products manually (basic fields only).
- Export products + inventory to Excel.
- Import Excel to create/update products and inventory.

## Constraints
- Renderer never persists authoritative data.
- All persistence via IPC to SQLite.
- Spanish (MX) UI text via dictionary keys.

## Out of Scope
- Bulk pricing rules
- Supplier data
- Remote sync