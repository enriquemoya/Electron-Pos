Data access rules
- POS: SQLite is source of truth. Renderer never touches DB. IPC only.
- Cloud API: Prisma is source of truth for schema and migrations. Avoid new raw SQL.
- Online store: read only. Never use shared secret in client components.
