# Design: Blog System Weapon v1

## Architecture overview
Layering:
- Controller -> Use case -> Repository -> Prisma

Online-store consumes cloud-api responses and does not access Prisma directly.

## Data model
Prisma model: `BlogPost`
- id: String uuid
- slug: String
- locale: String
- title: String
- excerpt: String
- contentJson: Json
- coverImageUrl: String?
- authorName: String
- readingTimeMinutes: Int
- seoTitle: String
- seoDescription: String
- isPublished: Boolean
- publishedAt: DateTime?
- createdAt: DateTime
- updatedAt: DateTime

Indexes:
- unique `[slug, locale]`
- index `[locale, isPublished, publishedAt(sort: Desc)]`

Optional future extension:
- BlogTag many-to-many not required in v1 implementation

## Content pipeline
1. Admin edits structured Tiptap JSON document.
2. Client sends JSON payload to admin blog API.
3. Use case validates schema and sanitizes allowed node set.
4. Repository stores sanitized JSON in `contentJson`.
5. Public detail endpoint returns sanitized JSON and precomputed metadata.

## Sanitization strategy
Allowed nodes:
- paragraph
- heading levels 2 to 4
- text with marks: bold, italic, link
- bulletList, orderedList, listItem
- blockquote
- codeBlock
- image with safe `src` and `alt`

Rejected:
- script, iframe, style, raw HTML nodes, unknown nodes
- non-http/https image and link URLs

## Reading time
- Compute from sanitized plain text word count
- Formula: max(1, ceil(words / 200))
- Persist value in `readingTimeMinutes` for deterministic output

## API contracts
Admin blog DTO fields:
- id
- slug
- locale
- title
- excerpt
- contentJson
- coverImageUrl
- authorName
- readingTimeMinutes
- seoTitle
- seoDescription
- isPublished
- publishedAt
- createdAt
- updatedAt

Public list DTO fields:
- slug
- locale
- title
- excerpt
- coverImageUrl
- authorName
- readingTimeMinutes
- publishedAt

Public detail DTO fields:
- slug
- locale
- title
- excerpt
- contentJson
- coverImageUrl
- authorName
- readingTimeMinutes
- seoTitle
- seoDescription
- publishedAt

## SEO rendering design
Online-store blog detail page:
- SSR metadata from post payload
- Canonical: `/{locale}/blog/{slug}`
- Alternates: es and en
- OpenGraph and Twitter with CDN image URL
- Inject JSON-LD Article
- Inject JSON-LD BreadcrumbList
- Generate heading anchors and TOC server-side from `contentJson`

## RSS and sitemap design
Cloud-api provides:
- RSS XML endpoint filtered by locale and published posts
- Blog sitemap endpoint with published localized URLs

Online-store root sitemap route merges static URLs and API blog URLs.

## Performance design
- List query uses indexed where clause by locale and published state
- `take = 10` with offset pagination
- Detail query fetches one row by unique `(slug, locale)`
- No relation fan-out required, so no N+1 paths

## Security design
- Admin routes mounted under existing `requireAdmin` middleware
- Public endpoints expose only published content
- No internal admin ids in public payload
- Media URLs accepted only as absolute HTTPS URLs or trusted relative asset paths

## Edge cases
- Duplicate slug in same locale returns conflict error
- Same slug in different locale is valid
- Empty content or invalid node tree returns validation error
- Missing cover image still renders post page with fallback metadata image
- Unpublished post by slug returns not found on public endpoints

## Observability
- Log admin create/update/publish actions with post id and locale
- Log public not found lookups at debug level only
- Do not log full content payload in production logs
