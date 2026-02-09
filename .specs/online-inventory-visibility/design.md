# Online Inventory Visibility and Semantics - Design

## Conceptual Model
- Local POS inventory is authoritative and used for operational decisions.
- Cloud inventory is a read model derived from online events and snapshots.

## Read Model Interpretation
- read_model_inventory.available represents best-effort online availability.
- read_model_inventory.updated_at represents the last time the cloud view changed.
- The cloud view can be stale if POS is offline.

## State Transitions
- AVAILABLE -> LOW_STOCK when available approaches buffer or low threshold.
- LOW_STOCK -> SOLD_OUT when available <= 0.
- Any state -> PENDING_SYNC when cloud freshness exceeds tolerance.
- PENDING_SYNC -> AVAILABLE/LOW_STOCK/SOLD_OUT after sync refresh.

## POS Reconnection Effects
- On POS sync, online events are applied locally.
- Local stock may become negative if oversold.
- Cloud read model remains a mirror and does not force local corrections.

## Failure and Degradation Behavior
- Cloud up, POS down: online availability continues but may be stale.
- POS up, cloud down: POS operates normally; cloud is stale.

## UX Interpretation Guidelines (Non-UI)
- Frontend should treat AVAILABLE as best-effort only.
- Frontend should surface LOW_STOCK as advisory, not a guarantee.
- Frontend should surface SOLD_OUT as likely unavailable, not definitive.
- PENDING_SYNC should show a caution state and avoid hard promises.

## Safety by Design
- Ambiguity is intentional to prevent false guarantees.
- Event-based sync avoids race conditions and double counting.
- Cloud never becomes authoritative over POS inventory.
