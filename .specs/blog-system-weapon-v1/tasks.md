# Tasks: Blog System Weapon v1

## Phase 1: Spec
1. Create requirements, design, and tasks documents.
2. Run strict spec audit workflow.
3. Resolve blockers until READY.

## Phase 2: Data and Prisma
1. Add `BlogPost` model to Prisma schema.
2. Create migration with unique and index constraints.
3. Generate Prisma client.

## Phase 3: Cloud API implementation
1. Add blog repository contract in application ports.
2. Add blog use cases for admin CRUD and public reads.
3. Add blog repository implementation using Prisma queries.
4. Add validators for blog payload and content sanitization.
5. Add domain rule module for publish/update/delete invariants.
6. Add controllers and route wiring for admin and public blog endpoints.
7. Add admin mutation rate limit middleware (30 req/min per admin).
8. Add RSS endpoint and blog sitemap endpoint.
9. Add stable error mappings, including CDN validation errors.
10. Add soft delete handling for blog posts with `deletedByAdminName` snapshot.
11. Add best-effort R2 object cleanup during delete for cover and content image nodes.

## Phase 4: Online-store implementation
1. Add server API client for blog admin and public APIs.
2. Add admin blog list and editor route under `/{locale}/admin/blog`.
3. Refactor editor into components: BlogEditor, BlogToolbar, BlogStatusIndicator, BlogPreviewRenderer.
4. Integrate Tiptap editor with shadcn toolbar controls and floating quick actions.
5. Integrate image upload via existing admin media endpoint.
6. Add autosave draft flow with subtle status indicator (no toast spam).
7. Add public list page `/{locale}/blog` with pagination.
8. Add public detail page `/{locale}/blog/{slug}` with SSR render.
9. Add TOC generation and heading anchors.
10. Inject BlogPosting and BreadcrumbList JSON-LD.
11. Add sitemap route and RSS route integration in online-store.
12. Add i18n messages for new UI labels.
13. Add admin home navigation entry to blog editor.
14. Route home community teaser to localized public blog list.

## Phase 5: Validation and audit
1. Run `npm run prisma:generate -w apps/cloud-api`.
2. Run `npm run build -w apps/cloud-api`.
3. Run `npm run build -w apps/online-store`.
4. Run strict implementation audit workflow.
5. Fix blockers until SAFE.
6. Validate admin mutation endpoints with curl for publish, unpublish, and delete.
7. Generate Lighthouse artifacts for `/{locale}/blog` and a representative `/{locale}/blog/{slug}` page and verify SEO >= 95.
8. Validate BlogPosting and BreadcrumbList structured data with Rich Results test.
