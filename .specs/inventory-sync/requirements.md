# Inventory Sync & Reconciliation - Requirements

## Problem Statement
The local POS runs offline and is the operational source of truth. The online store uses a cloud database that can sell while the POS is offline. The system needs a safe and deterministic way to apply online sales to local inventory when the POS starts, without overwriting inventory or losing data.

## Inventory Sources
- Local POS inventory (SQLite)
- Cloud online inventory (Postgres mirror)

## Event Types
- ONLINE_SALE
- POS_SALE
- INVENTORY_ADJUSTMENT
- SNAPSHOT (optional, for diagnostics only)

## Core Rules
- Inventory sync is event-based.
- Inventory numbers are never overwritten blindly.
- Cloud does not directly mutate SQLite.
- POS reconciles online events at startup.
- POS continues to operate offline; sync is opportunistic.

## Operator Local Time Rule
- All event timestamps are stored as ISO UTC strings.
- Local display uses operator local machine time.
- Daily boundaries for reports use operator local time.

## Failure Scenarios
- POS offline: online events accumulate in cloud.
- Cloud offline: POS operates normally and retries later.
- Partial reconciliation: POS applies some events and resumes later without duplication.
- Duplicate events: POS must detect and skip already applied events.

## Explicit Non-Goals
- Pricing sync
- Real-time reservations
- Multi-warehouse logic
- Supplier restock logic
- Cloud-driven writes outside the startup sync flow
- UI styling or layout decisions
