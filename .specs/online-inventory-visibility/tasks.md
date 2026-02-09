# Online Inventory Visibility and Semantics - Tasks

## Documentation and Contracts
- Document online inventory semantics for storefront teams.
- Define glossary for states and non-guarantees.

## Cloud Read Model Alignment
- Ensure read_model_inventory includes updated_at.
- Define safety buffer policy and how it maps to states.

## POS Sync Alignment
- Ensure reconciliation marks negative stock for review.
- Ensure applied events do not overwrite local stock blindly.

## Frontend Consumption Rules
- Map read model states to frontend labels without promises.
- Avoid absolute claims in UI messaging.

## Validation and Test Scenarios
- POS offline with online sales: verify PENDING_SYNC semantics.
- Oversell scenario: verify SOLD_OUT or negative availability state.
- Stale data: verify freshness warning policy.
