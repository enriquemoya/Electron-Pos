## Layout overview
The catalog page is a single-page layout with:
- Header/navigation reused from existing spec
- Filter bar
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

## Section behavior
### Filter bar
- Filters: category, availability state, game type (if provided by API), price range.
- Filters are optional and can be cleared.
- Mobile-first: filters stack vertically, and the price slider appears inside the mobile
  filter drawer panel.
- Price range slider uses shadcn/ui Slider and represents a min/max range in MXN.
- Slider updates the URL without a full page reload.

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
- FilterBar
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
