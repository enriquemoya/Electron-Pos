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
- Architecture must keep strict separation:
  - controller handles transport only
  - use case handles blog rules
  - validation is isolated
  - repository handles persistence only

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
- Delete action required (soft delete)
- Sticky action bar required for save, publish, unpublish, delete, and status

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
- BlogPosting JSON-LD
- BreadcrumbList JSON-LD
- SSR HTML render from sanitized document
- Target Lighthouse SEO score >= 95 on blog detail pages

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
- Cover images and Tiptap image nodes must be CDN-only absolute HTTPS URLs
- Reject relative URLs, base64 data URLs, and non-HTTPS image URLs
- Add rate limit on admin blog mutations: 30 requests per minute per admin
- Rate-limit responses must use stable API error taxonomy.

## State integrity rules
- Published posts cannot change slug.
- Deleted posts cannot be updated, published, or unpublished.
- Unpublished or deleted posts must never appear on public routes, sitemap, or RSS.
- Publish and unpublish transitions are explicit actions only.
- Delete uses soft-delete semantics only.
- Admin get-by-id excludes deleted posts by default.
- Delete triggers best-effort R2 cleanup for cover and content image keys.
- R2 cleanup failures are non-blocking and do not rollback soft-delete.

## API behavior
Admin endpoints (protected):
- `GET /admin/blog/posts`
- `POST /admin/blog/posts`
- `GET /admin/blog/posts/:id`
- `PATCH /admin/blog/posts/:id`
- `POST /admin/blog/posts/:id/publish`
- `POST /admin/blog/posts/:id/unpublish`
- `DELETE /admin/blog/posts/:id`

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
- `BLOG_INVALID_STATE`
- `BLOG_TOO_LARGE`
- `BLOG_RATE_LIMITED`
- `BLOG_MEDIA_NOT_CDN`
- `BLOG_MEDIA_INVALID_HOST`
- `BLOG_MEDIA_NOT_ALLOWED`
- `BLOG_INTERNAL_ERROR`

## i18n impact
- New UI labels required in `es-MX.json` and `en-US.json`
- Locale in URL remains authoritative
- Slug uniqueness is scoped per locale, not global

## Acceptance criteria
- Prisma migration applies cleanly
- `(slug, locale)` uniqueness enforced
- Draft posts hidden from public API and routes
- Post page includes valid BlogPosting and BreadcrumbList JSON-LD
- RSS endpoint returns valid XML for published posts
- Sitemap includes localized blog URLs only for published posts
- Admin editor uploads images through existing media endpoint
- CDN-only image validation is enforced for cover image and content images
- Admin mutation routes enforce 30 req/min rate limit
- Admin publish, unpublish, and delete endpoints are validated with curl.
- Lighthouse SEO score is >= 95 for `/{locale}/blog` and a representative post page with saved artifacts.
- Structured data is validated with Rich Results testing for BlogPosting and BreadcrumbList.
- Delete operation completes even if R2 cleanup fails.
- Build passes for cloud-api and online-store
- Spec audit verdict READY
- Implementation audit verdict SAFE

## Validation commands
- Publish: `curl -X POST "$CLOUD_API_URL/admin/blog/posts/{id}/publish" -H "authorization: Bearer <admin_token>" -H "x-cloud-secret: <secret>"`
- Unpublish: `curl -X POST "$CLOUD_API_URL/admin/blog/posts/{id}/unpublish" -H "authorization: Bearer <admin_token>" -H "x-cloud-secret: <secret>"`
- Delete: `curl -X DELETE "$CLOUD_API_URL/admin/blog/posts/{id}" -H "authorization: Bearer <admin_token>" -H "x-cloud-secret: <secret>"`
- Lighthouse artifact generation: `npx lighthouse "http://localhost:3000/es/blog" --output=json --output-path=./reports/lighthouse/blog-list-es.json --chrome-flags=\"--headless\"`
- Lighthouse artifact generation: `npx lighthouse "http://localhost:3000/es/blog/{slug}" --output=json --output-path=./reports/lighthouse/blog-detail-es.json --chrome-flags=\"--headless\"`
- Structured data verification: run Google Rich Results Test against blog detail URL and confirm BlogPosting and BreadcrumbList are valid.
