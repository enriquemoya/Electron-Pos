# Online Store Frontend v1 - Requirements

## Purpose and Non-Goals
Purpose: define the first online storefront that consumes Cloud API v1 and respects online inventory semantics.
Non-goals: payments, authentication, POS logic, admin tools, promotions, or discounts.

## Target Users
- Retail customers browsing TCG products
- Mobile-first shoppers

## Supported Pages (v1)
- Home
- Catalog
- Product Detail
- Cart
- Checkout (no payment)

## Inventory Visibility Rules
- Show inventory states as semantic labels: AVAILABLE, LOW_STOCK, SOLD_OUT, PENDING_SYNC.
- Avoid language that promises fulfillment.
- Use cautious messaging for LOW_STOCK and PENDING_SYNC.

## Cart Rules
- Items can be added from catalog or product detail.
- Quantity changes are client-side only.
- If inventory becomes SOLD_OUT or PENDING_SYNC, block checkout and show a warning.

## Checkout Rules
- Checkout collects customer details and confirms order submission.
- Orders are submitted to POST /orders only when all items are not SOLD_OUT.
- No payment step in v1.

## Error and Empty States
- Catalog empty state when no products are available.
- Cart empty state when no items added.
- Network error state for API failures.

## Performance and SEO Constraints
- Use static pages where possible and API data for catalog.
- Use basic SEO tags for product pages.
- Avoid heavy client bundles.

## Explicit Non-Guarantees
- No guarantee of real-time stock accuracy.
- No guarantee that an order will always be fulfillable.
