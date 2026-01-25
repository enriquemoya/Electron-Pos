# Online Store Frontend v1 - Tasks

## Project Setup
- Create Next.js app for online store frontend.
- Configure environment variables for Cloud API base URL.

## Routing and Pages
- Implement routes: /, /catalog, /product/[slug], /cart, /checkout.
- Add page shells aligned with approved design layout.

## Data Fetching
- Implement catalog and product detail data fetchers.
- Add API client for Cloud API v1.
- Handle loading and error states per page.

## Inventory Semantics Mapping
- Map availability states to UI labels and warnings.
- Block add-to-cart and checkout for SOLD_OUT.
- Block checkout for PENDING_SYNC.

## Cart and Checkout Logic
- Implement client-side cart store with localStorage persistence.
- Support quantity changes and item removal.
- Submit orders via POST /orders.

## Error Handling and Empty States
- Add empty states for catalog and cart.
- Add network error messaging for failed requests.

## Performance and SEO
- Add basic SEO metadata for catalog and product pages.
- Use responsive images and limit client bundle size.

## Validation Scenarios
- Offline Cloud API: show error states.
- LOW_STOCK messaging appears without promises.
- SOLD_OUT blocks add-to-cart and checkout.
- PENDING_SYNC blocks checkout but allows browsing.
