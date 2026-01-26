## Purpose
Define the v1 landing page for the online store as a marketing entry point that
communicates the brand, highlights featured products, and promotes community and events.

## Goals
- Provide a marketing-first landing page with clear CTAs.
- Highlight featured products from the Cloud API read model.
- Showcase game highlights (Pokemon, One Piece, Yu-Gi-Oh!, Others).
- Include community and events teasers with safe placeholder links.
- Keep all content mobile-first and i18n-ready.

## Non-goals
- No catalog page changes.
- No product detail page changes.
- No cart or checkout logic.
- No authentication or user accounts.
- No admin or CMS tooling.
- No POS or Electron changes.
- No Cloud API changes (assume featured endpoint exists).

## Scope
In scope:
- Landing page layout and sections only:
  - Hero
  - Featured products
  - Game highlights
  - Community/news/events teaser
  - CTA
- Section-level loading and empty states.
- Reusable component contracts used by the landing page.

Out of scope:
- Header and main navigation (use existing spec).
- Catalog filters, pagination, or product grids beyond featured section.

## Constraints
- Online-store only.
- Read-only data access via Cloud API.
- URL-based locales only (/es default, /en).
- Dark theme only, no glassmorphism.
- Tailwind + shadcn/ui only.
- No hardcoded user-visible strings in JSX.
- Availability semantics are non-guaranteed labels only.

## Assumptions
- Featured products endpoint exists and is read-only.
- Header and navigation are already implemented and reused.

## Acceptance summary
- Landing page renders all sections with safe empty and error states.
- Featured products never block the entire page on failure.
- All user-visible text is localized via next-intl keys.
