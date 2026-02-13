# Requirements

## Goals
- Deliver a premium footer, legal pages, and FAQ experience for the online store.
- Add SEO structured data (LocalBusiness, Organization, FAQPage, BreadcrumbList).
- Improve conversion microcopy without changing checkout, cart, or order logic.
- Ensure all user-visible copy is localized via next-intl (es-MX, en-US).

## Scope
- online-store only
- Footer, legal pages (faq, terms, privacy, returns), FAQ, and SEO metadata
- Newsletter UI only (no backend integration)
- Locale-aware internal routing

## Non-goals
- No changes to cloud-api or data layer
- No changes to checkout, cart, order lifecycle, or payment logic
- No new runtime dependencies

## Constraints
- Preserve premium dark theme and existing design system
- Use shadcn primitives already available (Card, Badge, Button, Input)
- Internal links must be locale-prefixed: /{locale}/...
- No API contract changes

## i18n
- All copy must live in messages files for es-MX and en-US
- No hardcoded strings in UI components

## Error Handling
- Newsletter submission:
  - Invalid email -> toast error
  - Duplicate email -> toast info
  - Success -> toast success
  - Network/server error -> toast error
  - Loading state disables button and blocks double submit
- Legal pages:
  - If content is missing/unavailable, render a safe fallback UI with a link back to home
  - No runtime crash
