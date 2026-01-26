## Problem statement
The online store needs a read-only Cloud API endpoint that returns a curated list
of featured products for the landing page, with deterministic ordering and safe,
non-authoritative availability signaling.

## Goals
- Expose a read-only endpoint that returns featured products only.
- Support deterministic ordering via an explicit order field.
- Use Prisma as the only data access layer.
- Return availability as semantic states without stock guarantees.
- Keep response locale-agnostic.

## Non-goals
- No write operations or admin workflows.
- No authentication changes or new auth mechanisms.
- No POS or Electron integration.
- No stock reservation, allocation, or pricing guarantees.

## Constraints
- Cloud API remains read-only and non-authoritative for inventory.
- Prisma is the only schema and query layer for cloud-api.
- Schema changes must be additive and forward-only.
- Hard limit of 12 featured items per response.
- Ordering: featuredOrder ASC, then createdAt DESC.
- Auth policy: requires existing x-cloud-secret header for consistency with cloud-api.

## Assumptions
- Product, Inventory, and Category read models already exist.
- Availability is derived from inventory read models only.
- The online store consumes this endpoint for landing surfaces only.

## Out of scope
- UI changes, frontend behavior, or catalog layout.
- Data ingestion pipelines or sync protocol changes.
