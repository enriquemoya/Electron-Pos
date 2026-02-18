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
5. Add controllers and route wiring for admin and public blog endpoints.
6. Add RSS endpoint and blog sitemap endpoint.
7. Add stable error mappings.

## Phase 4: Online-store implementation
1. Add server API client for blog admin and public APIs.
2. Add admin blog list and editor route under `/{locale}/admin/blog`.
3. Integrate Tiptap editor with shadcn toolbar controls.
4. Integrate image upload via existing admin media endpoint.
5. Add autosave draft flow.
6. Add public list page `/{locale}/blog` with pagination.
7. Add public detail page `/{locale}/blog/{slug}` with SSR render.
8. Add TOC generation and heading anchors.
9. Inject Article and BreadcrumbList JSON-LD.
10. Add sitemap route and RSS route integration in online-store.
11. Add i18n messages for new UI labels.

## Phase 5: Validation and audit
1. Run `npm run prisma:generate -w apps/cloud-api`.
2. Run `npm run build -w apps/cloud-api`.
3. Run `npm run build -w apps/online-store`.
4. Run strict implementation audit workflow.
5. Fix blockers until SAFE.
