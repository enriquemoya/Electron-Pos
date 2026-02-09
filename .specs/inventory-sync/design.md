# Inventory Sync & Reconciliation - Design

## High-Level Flow (POS Startup Handshake)
1) POS starts and opens local DB.
2) POS requests pending online inventory events from cloud.
3) POS applies events locally in order, recording movements.
4) POS acknowledges applied events to cloud.
5) POS continues normal operation.

ASCII flow:
POS start -> fetch pending events -> apply locally -> ack events -> continue

## Cloud Pending Events Model
- Cloud stores inventory events in append-only form.
- Each event has a unique event_id and source metadata.
- Cloud exposes a query for events not yet acknowledged by a POS device.

## Local Reconciliation Algorithm
1) Fetch pending events ordered by created_at, then event_id.
2) For each event:
   - Check local applied_event table for event_id.
   - If already applied, skip.
   - Apply inventory movement (delta negative for ONLINE_SALE).
   - Record movement with source ONLINE and reference to order_id.
   - Insert event_id into applied_event table.
3) After batch apply, send ack list to cloud.

## Inventory Movement Recording
- Each applied online event becomes a local inventory movement.
- Movement fields include:
  - product_id
  - delta
  - source = ONLINE
  - reference_type = ORDER
  - reference_id = order_id
  - created_at (event timestamp)

## Idempotency Rules
- event_id is globally unique.
- applied_event table prevents double application.
- If ack fails, POS can re-fetch and skip already applied events.

## Online Sales Exceed Local Stock
- If delta would make stock negative:
  - still apply movement and allow negative stock locally.
  - mark movement with a flag for review.
  - POS continues operating and can reconcile later.

## Stock Shown Online vs Stock in POS
- Cloud mirrors local inventory but may be stale between syncs.
- Online store uses cloud stock with a safety buffer if configured.
- Local POS does not trust cloud inventory numbers.

## Safety Buffer (Optional)
- Cloud may apply a safety buffer for online stock.
- Buffer is a fixed quantity per product or a global percentage.
- Buffer is optional and does not affect local POS logic.

## Retry and Confirmation Flow
- If cloud fetch fails, POS continues offline.
- If apply fails mid-batch:
  - POS stops applying and keeps applied_event entries.
  - Next startup resumes from remaining events.
- Ack is sent only after local apply succeeds.

## Why This Design Avoids Race Conditions
- Local DB is the only authoritative store for POS operations.
- Cloud events are append-only and idempotent.
- No real-time locks or shared counters are used.
