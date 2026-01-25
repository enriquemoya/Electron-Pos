# Online Store Backend (Cloud API v1) - Tasks

## Cloud DB Schema
- Create event_store table with event_id, occurred_at, type, source, payload, status.
- Create pos_ack table for per-pos acknowledgements.
- Create read_model_inventory table for online view.

## API Endpoints
- POST /orders: validate input, write events, update read model.
- POST /sync/events: append events with idempotency key.
- GET /sync/pending: return pending events for a POS device.
- POST /sync/ack: record acknowledgements and mark events applied.
- GET /read/products: read-only listing from read model with pagination and filters.

## Validation and Idempotency
- Enforce unique idempotency key per event.
- Enforce deterministic ordering on GET /sync/pending.
- Validate order payload schema strictly.

## POS Integration Contract Tests
- Verify pending events are returned in order.
- Verify ack is idempotent and safe to retry.
- Verify duplicate order submissions do not create duplicate events.

## Operational Safeguards
- Rate limit sync endpoints.
- Log event ingestion and ack results (no PII).
- Reject events missing required fields.
- Add indexes for read model listing filters (gameTypeId, expansionId, name).

## Developer Testing Scenarios
- POS offline while orders accumulate.
- POS startup pulls pending events and acks.
- Duplicate order submission and idempotency handling.
- Cloud outage returns error without data loss.
