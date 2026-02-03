## Phase 1 - Structure
- Create landing page route under locale scope (/es, /en).
- Ensure header/nav is reused and not re-implemented.

## Phase 2 - Components
- Build landing components:
  - Section
  - SectionHeader
  - HeroBlock
  - FeaturedGrid
  - GameHighlightCard
  - CommunityTeaserCard
  - CTAButton
- Add hero banner image asset in online-store public assets.
- Render hero banner image in HeroBlock with next/image.
- Add community/news/events background images as local assets.
- Render community/news/events background images in CommunityTeaserCard.

## Phase 3 - Data wiring
- Fetch featured products from the Cloud API featured endpoint.
- Map availability labels only.
- Limit to 12 items.

## Phase 4 - States
- Add skeleton loading for featured products.
- Add empty and error states for featured section.
- Ensure other sections are static and do not fail.

## Phase 5 - i18n
- Add required translation keys for all sections.
- Ensure no hardcoded strings in JSX.
- Add landing.hero.imageAlt key.
- Add landing.community.* image alt keys.

## Phase 6 - Accessibility
- Validate semantic heading order.
- Ensure focus states on interactive elements.

## Phase 7 - Validation
- Verify mobile-first layout.
- Verify placeholder links do not break navigation.
