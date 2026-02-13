# Design

## Data Model (frontend-only)
```ts
FOOTER_LINKS: Array<{ labelKey: string; href: string }>
LEGAL_PAGES: Array<{ slug: string; titleKey: string }>
SOCIAL_LINKS: Array<{ key: string; href: string }>
BRANCHES: Array<{ id: string; nameKey: string; addressKey: string; mapsUrl: string }>
TRUST_BADGES: Array<{ icon: string; labelKey: string }>
```

## Flows
- Footer renders brand, quick links, help links, branches, social links, newsletter, trust badges.
- Legal pages and FAQ use localized content and metadata.
- JSON-LD:
  - LocalBusiness in locale layout
  - Organization on homepage
  - FAQPage on FAQ route
  - BreadcrumbList on catalog routes

## Locale Path Composition (hard rule)
- All internal hrefs MUST be built as `/${locale}${path}`.
- Never hardcode paths like `/catalog` without locale.

## Edge Cases
- Missing legal content -> show fallback UI and link to home.
- Missing FAQ data -> render empty state without crashing.
- Newsletter errors -> show toast and allow retry.

## Accessibility Notes
- Newsletter input must have label or aria-label.
- Helper text must use aria-describedby.
- FAQ accordion must be keyboard-friendly (details/summary or equivalent).
- Links must have visible focus states from existing styles.
