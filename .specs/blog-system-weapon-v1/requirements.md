# Requirements: Blog System Weapon v1

## Goal
Deliver a production-grade blog system with admin authoring, SSR pages, strong SEO metadata, and structured data for high discoverability.

## Scope
- Modules: cloud-api, prisma, online-store
- Additive-only changes
- Integrate media uploads through existing admin media endpoint from cdn-media-system-v1

## Non-goals
- No checkout, payment, or refund domain changes
- No direct browser to R2 upload flow
- No migration of legacy blog content
- No markdown or raw HTML storage as source of truth

## Constraints
- Content source must be stored as Tiptap JSON only
- Public rendering must be server-side for SEO
- Admin and public routes must preserve existing auth boundaries
- No breaking API contract changes

## Content storage
- Store blog body in Prisma Json field `contentJson`
- Store locale-specific post records with unique `(slug, locale)`
- Draft and published states supported via `isPublished` and `publishedAt`

## Admin authoring requirements
- Admin route in online-store: `/{locale}/admin/blog`
- Editor uses Tiptap and shadcn UI
- Toolbar supports: heading h2-h4, bold, italic, bullet list, ordered list, code block, blockquote, image, link
- Image upload uses `POST /admin/media/upload` only
- Autosave draft behavior required
- Publish and unpublish actions required

## Public experience requirements
- Public list route: `/{locale}/blog`
- Public detail route: `/{locale}/blog/{slug}`
- List is paginated with page size 10
- Draft posts must never appear on public routes, RSS, or sitemap
- Reading time displayed from stored `readingTimeMinutes`
- Table of contents generated from heading nodes in content

## SEO weapon mode requirements
Each public post page must include:
- Canonical URL
- Hreflang alternates for `es` and `en`
- OpenGraph and Twitter metadata
- Article JSON-LD
- BreadcrumbList JSON-LD
- SSR HTML render from sanitized document

List page requirements:
- Canonical URL
- Hreflang alternates
- Indexable pagination

Feed and discovery requirements:
- RSS endpoint for published posts only
- Sitemap must include published blog URLs per locale

## Performance constraints
- Public list endpoint must use pagination limit 10
- Use indexed query by locale, publish state, and published date
- Avoid N+1 in list and detail queries
- Cache strategy allowed on public reads via revalidation or cache headers

## Security constraints
- Admin blog API endpoints require admin role
- Content sanitization must remove unsafe nodes and attributes
- No script tags or event handlers allowed in rendered output
- Frontend must not receive storage credentials
- Public payloads must not expose internal admin ids

## API behavior
Admin endpoints (protected):
- `GET /admin/blog/posts`
- `POST /admin/blog/posts`
- `GET /admin/blog/posts/:id`
- `PATCH /admin/blog/posts/:id`
- `POST /admin/blog/posts/:id/publish`
- `POST /admin/blog/posts/:id/unpublish`

Public endpoints:
- `GET /blog/posts?locale=es&page=1&pageSize=10`
- `GET /blog/posts/:slug?locale=es`
- `GET /blog/rss?locale=es`
- `GET /blog/sitemap?locale=es`

## Error handling
Stable error codes:
- `BLOG_INVALID_PAYLOAD`
- `BLOG_NOT_FOUND`
- `BLOG_SLUG_CONFLICT`
- `BLOG_UNAUTHORIZED`
- `BLOG_INVALID_CONTENT`
- `BLOG_INTERNAL_ERROR`

## i18n impact
- New UI labels required in `es-MX.json` and `en-US.json`
- Locale in URL remains authoritative
- Slug uniqueness is scoped per locale, not global

## Acceptance criteria
- Prisma migration applies cleanly
- `(slug, locale)` uniqueness enforced
- Draft posts hidden from public API and routes
- Post page includes valid Article and BreadcrumbList JSON-LD
- RSS endpoint returns valid XML for published posts
- Sitemap includes localized blog URLs only for published posts
- Admin editor uploads images through existing media endpoint
- Build passes for cloud-api and online-store
- Spec audit verdict READY
- Implementation audit verdict SAFE
