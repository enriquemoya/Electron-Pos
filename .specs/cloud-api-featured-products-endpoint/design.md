## High-level architecture
- Cloud API exposes a new read-only endpoint:
  - GET /api/cloud/catalog/featured
- Data is sourced from Prisma read models (Product, Inventory, Category).
- No writes or mutations occur in this endpoint.
- Endpoint is registered under the existing Cloud API router and uses the shared-secret middleware (x-cloud-secret).

## Data model changes
Product:
- isFeatured (boolean, default false)
- featuredOrder (integer, nullable)

No destructive schema changes.

## Endpoint contract
GET /api/cloud/catalog/featured

Response (high level):
{
  "items": [
    {
      "id": "string",
      "slug": "string",
      "name": "string",
      "game": "pokemon" | "one-piece" | "yugioh" | "other",
      "imageUrl": "string",
      "price": number,
      "currency": "MXN",
      "availability": "in_stock" | "low_stock" | "out_of_stock",
      "featuredOrder": number | null
    }
  ],
  "meta": {
    "total": number
  }
}

## Query rules
- Filter: isFeatured = true
- Limit: 12 items max
- Order by (Prisma-safe):
  - Query A: featuredOrder != null ordered by featuredOrder ASC, createdAt DESC
  - Query B: featuredOrder == null ordered by createdAt DESC
  - Merge A then B, then take first 12 items

## Availability semantics
- availability is derived from inventory read models.
- Define LOW_STOCK_THRESHOLD = 3.
- Mapping:
  - available <= 0 -> out_of_stock
  - available > 0 and available <= LOW_STOCK_THRESHOLD -> low_stock
  - available > LOW_STOCK_THRESHOLD -> in_stock
- No exact quantities are exposed.
- No guarantees of real-time accuracy.

## Error handling
- Endpoint never mutates data.
- On error, return JSON error with safe status code (500).
- No internal details in the response body.

## Security
- Public read-only endpoint.
- Must not expose internal costs or POS-only fields.

## Localization
- Response is locale-agnostic.
- Localization is handled by the frontend.

## Edge cases
- No featured products: return empty items list and meta.total = 0.
- Missing optional fields: return nulls for slug, name, imageUrl, category.
