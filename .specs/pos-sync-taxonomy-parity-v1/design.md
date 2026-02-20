# pos-sync-taxonomy-parity-v1 - Design

## Current Gap
Current POS sync primarily materializes PRODUCT entities. Category behavior in POS remains hardcoded via enum and static select options. Game and expansion values are partially derived, not fully contract-driven taxonomy projection. This creates parity drift versus cloud source data.

## Scope Boundaries
- Extend existing sync and projection behavior only.
- Preserve existing sales and order sync behavior.
- Keep additive compatibility for cloud contracts.

## Cloud Sync Contract Expectations
Expected entity types in sync payload:
- PRODUCT
- GAME
- EXPANSION
- CATEGORY

Expected payload shape per entity:
- entityType
- cloudId
- updatedAt
- versionHash
- payload:
  - name
  - enabledPOS
  - enabledOnlineStore
  - isDeletedCloud or deletedAt
  - reference fields when applicable

If current cloud payload lacks taxonomy entity types, add additive contract support without breaking existing PRODUCT payload consumers.

## Architecture Chain

### Cloud
Controller -> Use Case -> Repository -> Storage

### POS
IPC Controller -> Use Case -> Repository -> Storage

### Projection Layer
- Separate materializer module under POS sync use case.
- Input: normalized cloud entities by type.
- Output: transactional upserts and soft-disable markers in local SQLite domain tables.
- No UI logic inside projector.

## Projection Algorithms

### Snapshot Algorithm
1. Start transaction.
2. For each entityType, build incoming cloudId set.
3. Soft-disable existing projected rows for that entityType as pre-pass.
4. Upsert incoming rows by cloudId.
5. Resolve product taxonomy references against projected taxonomy cloudIds.
6. Mark missing rows as soft-deleted or disabled.
7. Update sync state only after successful projection.
8. Commit transaction.

### Delta Algorithm
1. Start transaction.
2. Validate each entityType and required fields.
3. Upsert entities by cloudId.
4. Apply enabled flags and soft-delete markers.
5. Validate PRODUCT taxonomy references after taxonomy upserts in same transaction.
6. Update sync state timestamps and version if valid.
7. Commit transaction.

### Referential Integrity Rules
- PRODUCT row with missing taxonomy references must raise stable mapping error and skip invalid projection for that row, without corrupting other rows.
- Historical sale references remain intact by avoiding hard-delete of projected entities.

## Version Guard Rules
- Reject invalid version format.
- Ignore epoch placeholder versions when they would regress state.
- Never overwrite last valid local version with regressive value.
- Emit stable version regression code for observability.

## POS UI Consumption Design
- Product list, new sale search, and pickers read taxonomy and product values from projected SQLite tables.
- Category picker must consume categories table records instead of static enum select options.
- Minimal empty state behavior:
  - show no-options message
  - allow reconcile trigger

## Reconcile Design
- Reconcile request from POS contains local taxonomy and product mappings by entityType with cloudId and versionHash summary.
- Cloud response returns missing and outdated sets by entityType.
- POS applies correction through existing snapshot or delta fetch path and projector.
- Reconcile is non-destructive and must not auto-remove legacy rows.

## Data Integrity and Legacy Handling
- Legacy local rows without cloudId remain marked legacy.
- Legacy rows are excluded from cloud parity decisions unless explicitly mapped later.
- No automatic destructive cleanup for legacy rows.

## Security and Branch Scope
- Terminal-auth required for sync and reconcile.
- Branch scope derived from terminal identity in cloud use case.
- No secret propagation to renderer.

## Error Mapping Strategy
- Unsupported entityType -> SYNC_ENTITYTYPE_UNSUPPORTED
- Missing required taxonomy field -> TAXONOMY_MISSING_REQUIRED_FIELD
- Duplicate cloudId in projection target -> TAXONOMY_CLOUDID_DUPLICATE
- Missing taxonomy reference for product -> TAXONOMY_REFERENCE_NOT_FOUND
- Reconcile transport or parse failure -> RECONCILE_FAILED
- Version regression attempt -> SYNC_VERSION_REGRESSION

## Observability Strategy
- Emit structured events per sync run with counts by entityType.
- Include branchId, terminalId, syncSessionId, and projection result counters.
- Emit explicit reconcile summary counters for missing and outdated entities.
