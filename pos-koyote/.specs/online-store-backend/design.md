# Online Store Backend (Cloud API v1) - Design

## High-Level Architecture Diagram (Text)
Online Store -> Cloud API -> Event Store -> POS Sync
Online Store -> Cloud API -> Read Models -> Online Inventory View
POS -> Cloud API -> Sync Inbox

## Cloud Components
- API Layer: accepts orders and serves sync endpoints.
- Event Store: append-only events for POS reconciliation.
- Read Models: derived views for online store inventory display.

## Core API Endpoints
- POST /orders
  - Accepts an online order and emits ONLINE_SALE events.
- POST /sync/events
  - Append events from online store systems (optional for v1).
- GET /sync/pending
  - Returns events not yet acknowledged by a POS device.
- POST /sync/ack
  - Marks events as applied for a POS device.
- GET /read/products
  - Read-only catalog listing from read model tables.
  - Supports query, gameTypeId, expansionId, page, pageSize.
  - Returns product fields plus available and state.

## Event Lifecycle
Created -> Pending -> Applied -> Archived
- Created: event stored in event store.
- Pending: event is available to POS.
- Applied: POS acknowledged the event.
- Archived: event retained for audit, no longer pending.

## Inventory Read Strategy
- Cloud inventory view is snapshot-based and may be stale.
- No direct writes to POS DB.
- Cloud uses read models derived from events and last known inventory snapshots.

### Read Model Listing Contract (High-Level)
Response fields (example keys only):
- items[]: id, name, category, price, gameTypeId, expansionId, available, state, updatedAt
- page, pageSize, total

## Idempotency Strategy
- Each event has an event_id and idempotency key.
- Event store rejects duplicates by key.
- Acknowledgement is idempotent; repeated ack is safe.

## Concurrency and Safety
- No real-time locks or distributed transactions.
- Deterministic ordering avoids race conditions during apply.
- POS remains authoritative; cloud is a mirror.

## Relationship with POS Startup Sync
- POS calls GET /sync/pending at startup.
- POS applies events locally and posts ack.
- Cloud does not push into POS without request.

## Error Handling and Status Codes
- 200 OK: success
- 400 Bad Request: validation error
- 401 Unauthorized: auth missing (stub)
- 409 Conflict: idempotency conflict
- 500 Internal Server Error: server failure
