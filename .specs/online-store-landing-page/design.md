# Online Store Landing Page v1

## Page Layout
- Stacked sections in a single page under locale root route (/es, /en).
- Header and main navigation provided by existing spec, not defined here.
- Mobile first layout with responsive spacing and grid behavior.

## Sections and Behavior

### Hero Section
- Brand positioning and short value statement.
- Primary CTA to catalog or key game category.
- Optional secondary CTA for events or community.
- Imagery is optional and must not depend on backend assets.

### Featured Products Section
- Curated list from Cloud API read model.
- Uses shared ProductCard component (same as catalog).
- Read only and non guaranteed availability.
- Empty state: show friendly message and CTA to catalog.
- Error state: show non blocking error and optional retry hint.

### Game Highlights Section
- Four fixed blocks: Pokemon, One Piece, Yu-Gi-Oh, Others.
- Each block links to a filtered catalog view.
- Order is fixed and not locale dependent.
- Uses GameCard component.

### Community and News Section
- Teasers for news, tournaments, and events.
- Awareness only. Links can point to future routes.
- No CRUD or real time updates.
- Links may be placeholders in v1 and must not break navigation or promise active functionality.

### Call to Action Section
- Reinforce brand trust and guide to catalog.
- One primary CTA and optional secondary CTA.

## Component Breakdown
- Section
- SectionHeader
- ProductCard (shared with catalog)
- GameCard
- CTAButton

## Data Flow
- Cloud API read endpoints only.
- Featured products selection is read model driven:
  - Cloud curated list or flag based selection.
- Featured products are always sourced from Cloud API read models.
- When the API is unavailable, use UI only fallback (skeleton or empty state) and do not replace with hardcoded products.
- No direct database access from frontend.

## Error and Empty States
- All data errors render inline and do not block page.
- Empty featured list still renders section frame and CTA.
- Missing optional fields should not break layout.
- The landing page never fully errors; sections handle errors independently.

## Responsive Behavior
- Mobile first spacing and typography.
- Hero, highlights, and CTA must stack cleanly on small screens.
- Featured products grid adapts by viewport width.

## API Contracts
- Use existing Cloud API read model listing endpoint for products.
- No new backend endpoints defined here.

## Edge Cases
- Missing images or descriptions in read model.
- Featured list shorter than expected.
- API timeout or 500 responses.

## i18n and Accessibility
- All labels use translation keys.
- URL locale only, no auto detection.
- CTAs must be focusable and keyboard accessible.
- Images must include alt text from translations or safe defaults.
