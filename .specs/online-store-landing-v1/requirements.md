## Purpose
Define the v1 online-store landing page as a marketing-first entry point that
combines brand messaging, featured products, game highlights, community teasers,
and clear CTAs.

## Goals
- Deliver a mobile-first landing layout aligned with Danime Zone visual style.
- Reuse existing header and navigation without re-implementation.
- Surface featured products from the Cloud API read-only endpoint.
- Keep availability labels non-guaranteed.
- Ensure all user-visible text is localized via next-intl.
- Use a local hero banner image asset stored in the online-store app.
- Use local background images for community/news/events teaser cards.

## Non-goals
- No catalog page changes.
- No product detail page changes.
- No cart or checkout logic.
- No authentication or user accounts.
- No admin or CMS tooling.
- No POS or Electron changes.
- No Cloud API changes.

## Scope
In scope:
- Landing page sections only:
  - Hero
  - Featured products
  - Game highlights
  - Community/news/events teaser
  - CTA
- Section-level loading, empty, and error states.
- Reusable component definitions for landing.

Out of scope:
- Header and main navigation (reuse existing spec).
- Catalog filters or pagination changes.

## Constraints
- Online-store only.
- Read-only Cloud API usage.
- URL-based locales only (/es default, /en).
- Dark theme only, no glassmorphism.
- Tailwind + shadcn/ui only.
- No hardcoded user-visible strings in JSX.
- Availability semantics are labels only.
- Hero banner image must be stored as a local asset in online-store and not loaded from a remote URL.
- Community/news/events background images must be stored as local assets in online-store.

## Assumptions
- Featured endpoint exists and is read-only.
- Header/navigation are already implemented and reused.

## Acceptance summary
- Landing page renders all sections with safe section-level states.
- Featured products failure does not break the page.
- All user-visible strings are localized.
