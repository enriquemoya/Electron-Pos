# Online Inventory Visibility and Semantics - Requirements

## Purpose and Non-Goals
Purpose: define how online inventory values should be interpreted when the POS is local-first and may be offline.
Non-goals: POS internal inventory logic, sync implementation details, payments, backups, and UI layout.

## Inventory Authority Model
- POS inventory is authoritative and final.
- Cloud inventory is approximate and may be stale.
- Cloud values must not override POS values.

## Definition of Online Availability
- Online available is a best-effort view derived from cloud read models.
- Online available does not guarantee that a unit will be fulfilled.
- Online available is advisory and can be conservative.

## Inventory States (Semantic)
- AVAILABLE: online read model shows stock above safety buffer.
- LOW_STOCK: online read model is near zero or below buffer.
- SOLD_OUT: online read model shows zero or negative availability.
- PENDING_SYNC: local POS state is unknown or stale for the cloud.

## Offline POS Scenarios
- POS offline while online sales continue.
- Cloud read model continues to update from online orders only.
- POS reconciliation later may reduce local stock or create negative deltas.

## Oversell Scenarios
- Online may sell more than local stock if POS is offline.
- Reconciliation applies events locally and may result in negative stock.
- Negative stock must be visible for operator review.

## Time and Freshness Semantics
- Cloud read models include a last updated timestamp.
- Online view should treat data as stale beyond a tolerance window.
- Staleness tolerance is a policy decision, not a guarantee.

## Explicit Non-Guarantees
- No promise that online availability equals local stock.
- No promise of real-time consistency.
- No promise that orders will always be fulfillable.
