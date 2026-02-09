# Inventory Sync & Reconciliation - Tasks

## Cloud
- Store inventory events in an append-only table.
- Provide API to list pending events for a POS device.
- Provide API to acknowledge applied events.

## POS (Electron Main)
- Add startup handshake to fetch pending events.
- Apply online events in order and record local movements.
- Mark events as applied and send acknowledgements.
- Log failures locally without blocking POS startup.

## Local DB
- Add inventory_movements table if missing.
- Add applied_event table to track processed cloud events.
- Add indexes on event_id and created_at.

## IPC
- Define DTOs for event fetch and ack operations.
- Ensure renderer never accesses cloud or local DB directly.

## Validation
- Test offline startup with pending online events.
- Test duplicate event protection.
- Test partial apply and retry behavior.
- Test cloud offline and POS continues normally.
