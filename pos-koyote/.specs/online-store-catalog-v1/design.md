## Layout overview
The catalog page is a single-page layout with:
- Header/navigation reused from existing spec
- Filter sidebar (desktop) and filter drawer (mobile)
- Sort control
- Product grid
- Pagination controls

## Data flow
- Read-only fetch from Cloud API catalog endpoint.
- No direct database access from frontend.
- Availability is shown as labels only.
- Price range filter uses URL query params (priceMin, priceMax) as the source of truth.
- If the Cloud API does not support priceMin/priceMax, the UI still applies the range
  filter client-side after fetch and keeps the URL in sync.
- Filter options for category and game are fetched from a read-only Cloud API endpoint
  and used to populate comboboxes. The UI must not allow free text values.

## Section behavior
### Filter sidebar (desktop)
- Sticky left sidebar with collapsible content.
- Filters: text search, category, game, availability, price range.
- Filters are optional and can be cleared.
- Category and game use combobox components populated from API options.
- Combobox inputs are read-only and disabled while options are loading.

### Filter drawer (mobile)
- Filters hidden behind a button and opened in a sheet/dialog.
- Same filter set as desktop.
- Price slider appears inside the drawer.
- Drawer can be closed without applying changes.

### Active filter chips
- Render active filter chips above the grid.
- Chips reflect URL params (query, category, game, availability, price range).
- Chips can be cleared individually, updating the URL without full page reload.

### Sort control
- Options: newest, price (if available), availability.
- Default: newest.
- Sorting is client-triggered and reflected in API query params.

### Product grid
- Responsive grid:
  - Mobile: 2 columns
  - Tablet: 3 columns
  - Desktop: 4-5 columns
- Cards reuse the ProductCard component from landing where possible.
- Availability badges use semantic labels only.

### Pagination
- Server-driven pagination.
- Next/previous controls with current page indicator.
- Page size is fixed for v1.

## States
### Loading
- Show skeleton cards for grid.
- Filters and sort remain visible.

### Empty
- Show empty state message and optional CTA to clear filters.

### Error
- Section-level error message without breaking header or layout.

## Component breakdown
Reusable components:
- FilterSidebar
- FilterDrawer
- ActiveFilterChips
- FilterCombobox
- SortSelect
- ProductGrid
- ProductCard (reuse from landing)
- PaginationControls
- CatalogEmptyState
- CatalogErrorState
- CatalogSkeleton

## Data contract (catalog DTO)
{
  items: [
    {
      id: string,
      slug: string | null,
      name: string | null,
      imageUrl: string | null,
      category: string | null,
      price: number | null,
      currency: "MXN",
      availability: "in_stock" | "low_stock" | "out_of_stock",
      game: "pokemon" | "one-piece" | "yugioh" | "other"
    }
  ],
  page: number,
  pageSize: number,
  total: number,
  hasMore: boolean
}

## Data contract (catalog filters endpoint)
GET /api/cloud/catalog/filters (read-only)
{
  categories: [{ id: string, label: string }],
  games: [{ id: string, label: string }]
}

Notes:
- Values must match catalog query params.
- UI treats these values as the only valid filter options.

## Accessibility
- Filter controls are keyboard accessible.
- Price slider includes aria labels for min and max handles.
- Focus order is logical from filters to grid to pagination.
- Buttons and links have visible focus states.

## i18n key map
catalog:
- catalog.title
- catalog.filters.title
- catalog.filters.category
- catalog.filters.game
- catalog.filters.availability
- catalog.filters.price
- catalog.filters.priceMin
- catalog.filters.priceMax
- catalog.filters.chips
- catalog.filters.chipClear
- catalog.filters.noOptions
- catalog.filters.clear
- catalog.sort.label
- catalog.sort.newest
- catalog.sort.price
- catalog.sort.availability
- catalog.empty.title
- catalog.empty.body
- catalog.error.title
- catalog.error.body
- catalog.pagination.next
- catalog.pagination.prev

availability:
- availability.inStock
- availability.lowStock
- availability.outOfStock
