# Design: Blog System Weapon v1

## Architecture overview
Layering:
- Controller -> Use case -> Repository -> Prisma
- Validation module is isolated and reused by controllers.
- Domain rules module enforces publish/update/delete invariants.
- Mutation routes include middleware rate limiting with stable API errors.

Online-store consumes cloud-api responses and does not access Prisma directly.

## Explicit request-to-storage flow
1. Controller receives request, validates transport fields, and delegates.
2. Use case enforces domain state rules, media policy, and workflow sequencing.
3. Repository persists and reads blog records through Prisma.
4. Storage service (R2 media service) handles media object operations only.
5. Use case coordinates repository and storage for best-effort media cleanup on delete.

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
- isDeleted: Boolean
- deletedByAdminName: String?
- deletedAt: DateTime?
- publishedAt: DateTime?
- createdAt: DateTime
- updatedAt: DateTime

Indexes:
- unique `[slug, locale]`
- index `[locale, isPublished, publishedAt(sort: Desc)]`
- index `[isDeleted, locale, publishedAt(sort: Desc)]`

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
- image URLs that are not absolute HTTPS on configured CDN host
- relative image paths and base64 data URLs

## CDN enforcement strategy
- Validation checks `MEDIA_CDN_BASE_URL` host.
- Cover image URL and every Tiptap image node must match CDN host.
- If CDN base URL is missing or invalid, blog mutations fail with stable error.

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

Admin mutation endpoints:
- create, update, publish, unpublish, delete
- guarded with admin auth and rate limit middleware (30 req/min per admin)
- delete action writes admin snapshot and runs best-effort CDN cleanup

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
- Inject JSON-LD BlogPosting
- Inject JSON-LD BreadcrumbList
- Generate heading anchors and TOC server-side from `contentJson`
- Emit BlogPosting JSON-LD plus BreadcrumbList JSON-LD

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
- Public endpoints filter `isDeleted = false`
- Admin get-by-id filters `isDeleted = false` by default
- No internal admin ids in public payload
- Media URLs accepted only as absolute HTTPS URLs on the configured CDN host
- No trusted relative asset paths for blog images; CDN absolute URLs only
- Relative URLs and non-CDN hosts are rejected for `coverImageUrl` and image nodes in `contentJson`
- Delete cleanup parses keys only from `MEDIA_CDN_BASE_URL` and is non-blocking on R2 errors

## Error taxonomy
- `BLOG_INVALID_STATE` for invalid publish/unpublish/update/delete transitions
- `BLOG_TOO_LARGE` when content payload exceeds maximum bytes
- `BLOG_RATE_LIMITED` when admin mutation limit is exceeded
- `BLOG_MEDIA_NOT_CDN` when cover or content image URL host is not the configured CDN host

## Edge cases
- Duplicate slug in same locale returns conflict error
- Same slug in different locale is valid
- Empty content or invalid node tree returns validation error
- Missing cover image still renders post page with fallback metadata image
- Unpublished post by slug returns not found on public endpoints
- Published post slug change request is rejected.
- Deleted post operations are rejected with `BLOG_INVALID_STATE`.

## Observability
- Log admin create/update/publish actions with post id and locale
- Log public not found lookups at debug level only
- Do not log full content payload in production logs
