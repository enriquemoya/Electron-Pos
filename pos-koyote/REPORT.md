# Current DB Systems

## POS (SQLite)
- DB access: `packages/db/src/db.ts` (better-sqlite3) and repositories under `packages/db/src/repositories`.
- Schema source: `packages/db/src/schema.ts` (schemaSql + indexesSql).
- Runtime migrations: `packages/db/src/db.ts` applies `schemaSql` and ad-hoc `ALTER TABLE` guards.

Tables (POS SQLite):
- schema_version
- game_types
- expansions
- products
- inventory
- inventory_movements
- applied_events
- inventory_sync_state
- product_alert_settings
- inventory_alerts
- shifts
- sales
- sale_items
- sync_state
- customers
- store_credit_movements
- tournaments
- tournament_participants
- tournament_prizes

## Cloud (Postgres / Neon)
- DB access: `apps/cloud-api/src/index.ts` uses `pg` with raw SQL.
- Schema sources:
  - Legacy SQL migrations: `apps/cloud-api/migrations/*.sql`
  - Prisma migrations (new): `apps/cloud-api/prisma/migrations/*`

Tables (Cloud Postgres):
- sync_events
- pos_event_ack
- orders
- read_model_inventory

# Schema Sources

- POS SQLite:
  - `packages/db/src/schema.ts` is the primary schema.
  - `packages/db/src/db.ts` has idempotent column guards for incremental changes.

- Cloud Postgres:
  - Legacy: `apps/cloud-api/migrations/*.sql` via `scripts/migrate.ts`.
  - Target: `apps/cloud-api/prisma/schema.prisma` + `apps/cloud-api/prisma/migrations/*`.

# Drift Causes

- Cloud schema drift occurs because the migration runner in `scripts/migrate.ts`
  executes SQL migrations without a tracking table. Missing files or wrong paths
  silently leave Neon out of date.
- Schema changes were added as new SQL migrations but not always applied to Neon.
- There is no centralized migration authority (both raw SQL and manual changes exist).

# Proposed Minimal Migration Path

1) Adopt Prisma migrations as the single source of truth for Cloud Postgres.
2) Keep raw SQL queries in `apps/cloud-api/src/index.ts` for now (no behavior change).
3) Use `prisma migrate deploy` for all environments; deprecate `scripts/migrate.ts`.
4) Validate Neon schema with Prisma migrations before any new changes.
