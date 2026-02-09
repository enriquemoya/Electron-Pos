Next.js online store skill

Rules
- next-intl for i18n, URL locale only.
- Server components fetch data from cloud API.
- Never expose CLOUD_SHARED_SECRET to client components.

Patterns
- Use server fetch with cache: no-store for catalog.
- Map availability states without promises.
