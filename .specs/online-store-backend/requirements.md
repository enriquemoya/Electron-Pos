# Online Store Backend (Cloud API v1) - Requirements

## Purpose and Non-Goals
Purpose: provide a cloud API for the online store that records online sales as events and exposes them to the POS for reconciliation. The cloud mirrors inventory and sales state but does not override POS data.
Non-goals: POS implementation details, UI behavior, payment provider integration, real-time sync, and backups.

## Authority Rules
- Cloud is NOT authoritative over inventory.
- POS is authoritative for operational inventory and final state.
- Cloud never writes directly to SQLite.

## Inventory Visibility Rules
- Online available stock is derived from cloud read models.
- A safety buffer may be applied to reduce overselling risk.
- Buffer does not change POS stock and is a cloud-only view rule.
- Read-only catalog listing is served from read model tables and is non-authoritative.

## Online Sales Handling
- Online orders create append-only events for POS reconciliation.
- Each order creates one or more ONLINE_SALE events.
- Events must include order id, product ids, quantities, and timestamps.

## Event Model
- Append-only: events are never deleted or rewritten.
- Idempotent: duplicate event submission is ignored using an idempotency key.
- Deterministic ordering: order by occurred_at then event_id.

## Failure Scenarios
- POS offline: events accumulate in the cloud inbox.
- Cloud partial outage: online orders may fail fast or queue with retry.
- Duplicate requests: de-duplication prevents double events.

## Security Constraints (High-Level)
- Authentication is a stub in v1.
- API keys or tokens are expected but not implemented here.
- No PII is returned in sync endpoints beyond order references.

## Time and Timestamp Rules
- Store all timestamps as ISO UTC strings.
- POS displays times in operator local time.

## Out of Scope
- POS data writes from cloud
- Pricing sync
- Real-time reservations
- Multi-warehouse logic
- Supplier restock logic
- Backup or disaster recovery
