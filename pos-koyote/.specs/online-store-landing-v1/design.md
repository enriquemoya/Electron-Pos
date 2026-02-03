## Layout overview
Stacked, mobile-first layout with five sections:
1) Hero
2) Featured products
3) Game highlights
4) Community/news/events teaser
5) CTA

Header and navigation are reused from the existing spec and are not redefined.

## Section behavior
### Hero
- Brand statement and primary CTA.
- Optional secondary CTA.
- Gradient background allowed, no glass effects.
- Static content.
- Hero banner image uses a local asset in the online-store app.
- Image uses next/image for responsive sizing and optimization.
- Image alt text uses an i18n key.

Loading/empty:
- Not applicable; static content.

### Featured products
- Read-only list from Cloud API featured endpoint.
- Reuse ProductCard from catalog when possible.
- Max 12 items.
- Availability labels only.

Loading/empty/error:
- Loading: skeleton cards.
- Empty: section message with CTA to catalog.
- Error: section message; page continues.

### Game highlights
- Fixed tiles: Pokemon, One Piece, Yu-Gi-Oh!, Others.
- Links to catalog with filters.
- Fixed order.

Loading/empty:
- Not applicable; static content.

### Community/news/events teaser
- Static teaser cards with optional placeholder links.
- Links may be placeholders but must not break navigation.
- Each card uses a local background image asset.
- Background images use cover/center with a dark overlay for readability.
- Card image alt text uses i18n keys.

Loading/empty:
- Not applicable; static content.

### CTA
- Reinforces primary catalog action and secondary community action.

Loading/empty:
- Not applicable; static content.

## Component breakdown
- Section
- SectionHeader
- HeroBlock
- FeaturedGrid
- GameHighlightCard
- CommunityTeaserCard
- CTAButton

Use shadcn/ui primitives (Button, Card, Badge) with Tailwind.

## Data contract (featured DTO)
{
  items: [
    {
      id: string,
      slug: string | null,
      name: string | null,
      game: "pokemon" | "one-piece" | "yugioh" | "other",
      imageUrl: string | null,
      price: number | null,
      currency: "MXN",
      availability: "in_stock" | "low_stock" | "out_of_stock",
      featuredOrder: number | null
    }
  ],
  meta: { total: number }
}

## Error handling strategy
- Page never fully errors.
- Each section handles its own empty/error state.

## Accessibility
- CTAs are keyboard accessible.
- Visible focus states in dark theme.
- Semantic headings (h2/h3 hierarchy).
- Descriptive link labels.

## i18n key map
common:
- common.shopNow
- common.viewAll
- common.learnMore

landing.hero:
- landing.hero.title
- landing.hero.subtitle
- landing.hero.primaryCta
- landing.hero.secondaryCta
- landing.hero.imageAlt

landing.featured:
- landing.featured.title
- landing.featured.empty
- landing.featured.error

landing.games:
- landing.games.title
- landing.games.pokemon
- landing.games.onePiece
- landing.games.yugioh
- landing.games.others

landing.community:
- landing.community.title
- landing.community.newsTitle
- landing.community.eventsTitle
- landing.community.communityTitle
- landing.community.placeholderLink
- landing.community.newsImageAlt
- landing.community.eventsImageAlt
- landing.community.communityImageAlt

landing.cta:
- landing.cta.title
- landing.cta.primaryCta
- landing.cta.secondaryCta

availability:
- availability.inStock
- availability.lowStock
- availability.outOfStock

## Acceptance criteria per section
Hero:
- CTAs visible and localized.

Featured products:
- Skeletons on load.
- Empty and error states shown without breaking page.
- Max 12 items.

Game highlights:
- Fixed order and labels.
- Links to catalog filters.

Community/news/events teaser:
- Placeholder links do not break navigation.

CTA:
- Primary and secondary actions present and localized.
