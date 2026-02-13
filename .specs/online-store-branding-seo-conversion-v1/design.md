# Design

## Data Model (frontend-only)
```ts
BRAND_ASSETS: {
  siteUrl: string;
  logoPath: string;
  heroImagePath: string;
}
FOOTER_LINKS: Array<{ labelKey: string; href: string }>
LEGAL_PAGES: Array<{ slug: string; titleKey: string }>
SOCIAL_LINKS: Array<{ key: string; href: string }>
BRANCHES: Array<{ id: string; nameKey: string; addressKey: string; mapsUrl: string }>
TRUST_BADGES: Array<{ icon: string; labelKey: string }>
```

## Performance Plan
- LCP element is hero image:
  - Use next/image with priority and fetchPriority high
  - Use optimized local asset and proper sizes
- Image strategy:
  - Local hero and placeholders use compressed JPEG assets
  - External product images route through /api/image-proxy for same-origin optimization
- Caching:
  - Featured products and taxonomy use revalidate caching
  - Catalog queries remain no-store
- JS strategy:
  - Keep landing page mostly server-rendered
  - Avoid adding new client-only dependencies

## Remote Image Strategy
- Use /api/image-proxy?url=...
- Allow https only
- Block private or local IPs
- Set cache-control for proxy responses

## Flows
- Footer renders brand, quick links, help links, branches, social links, newsletter, trust badges
- Legal pages and FAQ use localized content and metadata
- JSON-LD:
  - LocalBusiness in locale layout
  - Organization on homepage
  - FAQPage on FAQ route
  - BreadcrumbList on catalog routes

## Locale Path Composition (hard rule)
- All internal hrefs MUST be built as `/${locale}${path}`
- Use next-intl Link helpers to avoid double locale

## Edge Cases
- External image URL from unknown domain
- Missing hero or placeholder assets
- Newsletter network failure
- Locale switching should preserve path

## Accessibility Notes
- Newsletter input must have label or aria-label
- Helper text must use aria-describedby
- FAQ accordion must be keyboard-friendly
- Links must have visible focus states from existing styles
