# Online Store Landing Page v1

## Phase 1 - Spec Alignment
- Confirm header and navigation spec is referenced only, not duplicated.
- Confirm Cloud API read model endpoint contract for products.

## Phase 2 - UI Components
- Create Section and SectionHeader components for landing sections.
- Reuse ProductCard from catalog or align styles if shared.
- Create GameCard and CTAButton components.

## Phase 3 - Page Implementation
- Implement locale root landing page route.
- Add Hero, Featured Products, Game Highlights, Community and News, and CTA sections.
- Wire CTAs to catalog and game filtered views.
- Do not implement or duplicate header or navigation in this spec.

## Phase 4 - Data Integration
- Fetch featured products from Cloud API read model.
- Implement empty and error states for featured products.
- Ensure no direct database access.

## Phase 5 - i18n
- Add translation keys for all landing copy.
- Ensure no hardcoded strings in JSX.

## Phase 6 - Validation
- Verify mobile first layout behavior.
- Verify dark theme only and no glassmorphism.
- Verify read only data semantics and no stock guarantees.
