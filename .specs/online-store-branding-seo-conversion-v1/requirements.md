# Requirements

## Goals
- Deliver premium footer, legal pages, and FAQ for the online store.
- Improve SEO structured data and metadata correctness.
- Improve Lighthouse performance on mobile without changing core checkout or catalog behavior.
- Keep locale-in-URL rule and full localization via next-intl.

## Scope
- online-store only
- UI, SEO, and performance improvements
- Newsletter UI only (no backend integration)
- Locale-aware internal routing

## Non-goals
- No cloud-api or data changes
- No cart, checkout, or order flow changes
- No new backend services or heavy dependencies

## Constraints
- Preserve premium dark theme and current design tokens
- Use existing shadcn components only
- Internal links must be locale-prefixed: /{locale}/...
- No API contract changes

## Performance Targets
- Mobile performance score >= 80 on:
  - /{locale}
  - /{locale}/faq
  - /{locale}/terms
- Mobile LCP <= 3.0s on simulated slow 4G (best effort)
- No console errors on key routes

## SEO Validation
- Validate JSON-LD presence:
  - Home: LocalBusiness + Organization
  - FAQ: FAQPage
  - Catalog: BreadcrumbList
- Validate canonical and hreflang alternates:
  - canonical points to same-locale URL
  - alternates.languages includes es and en
- Verify sitemap and robots configuration
- Manual checks:
  - Google Rich Results Test for structured data
  - Search Console property verification and URL inspection

## i18n
- All copy must live in messages files for es-MX and en-US
- No hardcoded user-visible strings in components

## Error Handling
- Newsletter submission:
  - Invalid email -> toast error
  - Duplicate email -> toast info
  - Success -> toast success
  - Network/server error -> toast error
  - Loading state disables button and prevents double submit
- Legal pages:
  - If content is missing/unavailable, render fallback UI with a link back to home
  - No runtime crash
