## Phase 1 - Structure
- Create catalog page route under locale scope (/es, /en).
- Ensure header/nav is reused and not re-implemented.

## Phase 2 - Components
- Implement catalog components:
  - FilterBar
  - PriceRangeSlider (shadcn/ui Slider)
  - SortSelect
  - ProductGrid
  - ProductCard (reuse from landing)
  - PaginationControls
  - CatalogEmptyState
  - CatalogErrorState
  - CatalogSkeleton

## Phase 3 - Data wiring
- Fetch catalog data from Cloud API endpoint with pagination.
- Apply filters and sorting via query params.
- Sync priceMin and priceMax to URL query params without full page reload.
- Render availability labels only.

## Phase 4 - States
- Add skeleton loading for grid.
- Add empty state with clear-filters CTA.
- Add error state that does not break layout.

## Phase 5 - i18n
- Add required translation keys for catalog UI.
- Ensure no hardcoded strings in JSX.

## Phase 6 - Accessibility
- Validate keyboard navigation for filters, grid, and pagination.
- Ensure price slider includes aria labels for min and max handles.
- Ensure focus states in dark theme.

## Phase 7 - Validation
- Verify mobile-first layout and responsive grid.
- Verify filter and sort interactions update the list.
- Verify pagination behavior and limits.
