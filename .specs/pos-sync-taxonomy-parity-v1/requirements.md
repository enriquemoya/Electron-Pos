# pos-sync-taxonomy-parity-v1 - Requirements

## Objective
Close the POS taxonomy parity gap so cloud catalog taxonomy becomes the source of truth for POS. Replace hardcoded category behavior with cloud-synced taxonomy projection in SQLite and POS UI consumption from projected tables.

## Scope
- apps/desktop:
  - Extend local SQLite schema for taxonomy parity and cloud mappings.
  - Extend projection and sync engine to support taxonomy entity types.
  - Update IPC and repositories so POS UI reads dynamic taxonomy data.
  - Keep reconcile flow available through existing inventory sync IPC.
- apps/cloud-api:
  - Consume existing sync endpoints when possible.
  - Additive payload or endpoint contract changes only if taxonomy entities are missing from current sync contract.
- data:
  - SQLite additive schema updates for POS local projection.
  - Cloud Prisma changes only if strictly required and additive.
- apps/online-store:
  - Consume-only compatibility.
  - No redesign.

## Non-Goals
- No breaking changes to sales or order sync.
- No full sync engine rewrite.
- No UI redesign outside replacing hardcoded taxonomy selects with dynamic projected lists and minimal empty states.
- No destructive migration of historical sales references.

## Actors and Roles
- Terminal:
  - Executes snapshot, delta, and reconcile via terminal-auth sync endpoints.
  - Projects cloud taxonomy and products to local SQLite.
- Admin:
  - Manages authoritative cloud taxonomy and product settings.
  - Triggers or supervises reconcile checks from POS flows when needed.

## Functional Requirements
- Taxonomy parity projection:
  - POS must project taxonomy entity types from cloud sync contract:
    - GAME
    - EXPANSION
    - CATEGORY
  - Optional types such as SUBCATEGORY or TAG remain out of scope unless already present in contract and explicitly mapped.
- Taxonomy entity fields in projection:
  - cloudId
  - localId
  - name
  - enabledPOS
  - enabledOnlineStore
  - isDeleted
  - updatedAt
  - versionHash or equivalent version signal
- Product references:
  - Products must reference taxonomy by cloud identity fields, not hardcoded enum assumptions.
  - POS UI resolves display labels using local taxonomy tables.
- Snapshot behavior:
  - First run downloads full snapshot and projects taxonomy and products transactionally.
  - Snapshot projection uses soft-disable or soft-delete for missing entities and must not hard-delete by default.
- Delta behavior:
  - Delta updates must be idempotent and applied by entityType plus cloudId.
  - Enable flag updates and deletion markers must update local visibility rules.
- Reconcile behavior:
  - POS reconcile sends local mappings or cloudId manifests by entityType.
  - Cloud returns missing and outdated summary or equivalent plan.
  - Reconcile applies safe correction updates without destructive deletion.
- Flag behavior:
  - enabledPOS controls POS selection and sellability for new actions.
  - enabledOnlineStore is stored for parity and audit but does not drive POS sellability.
  - Disabled or soft-deleted taxonomy items are hidden for new selections but remain resolvable for historical records.
- UI parity:
  - Hardcoded category select must be replaced by dynamic category records from SQLite.
  - Product list, new sale search, and taxonomy pickers must consume projected data with enabledPOS and not-deleted filters.
- Backward compatibility:
  - Legacy local rows without cloudId are marked legacy and retained.
  - Reconcile reports legacy or unmapped rows without auto-destruction.
- Version safety:
  - Delta version regression guard must reject epoch or invalid values from overwriting last valid local version.

## Data Model
POS SQLite additive requirements:
- categories table or equivalent taxonomy table:
  - localId primary key
  - cloudId unique
  - name
  - enabledPOS
  - enabledOnlineStore
  - isDeletedCloud or deletedAt
  - cloudUpdatedAt
  - versionHash
- game_types table:
  - ensure cloudId unique and parity flags plus deletion marker
- expansions table:
  - ensure cloudId unique and parity flags plus deletion marker
  - optional linkage to gameCloudId
- products table:
  - ensure taxonomy cloud references exist and remain consistent with projected taxonomy
  - enforce enabledPOS and deletion filtering for read paths
- mapping table support:
  - cloudId to localId per entityType for reconcile and projection integrity
- indexes:
  - unique cloudId per entity table
  - enabledPOS plus deletion filter indexes
  - updatedAt indexes for sync comparisons

Cloud data model statement:
- No Prisma schema or migration changes are required if sync payload already includes taxonomy entities and flags.
- If missing, any cloud schema change must be additive only.

## Security
- Terminal-auth is mandatory for snapshot, delta, and reconcile endpoints.
- No client-side secrets in renderer.
- Projection writes are IPC-only; renderer never writes SQLite directly.
- Cross-branch leakage is forbidden; cloud sync queries must remain terminal branch scoped.
- Reconcile and sync endpoints should have rate-limit protection in middleware or infrastructure.
- Taxonomy payload trust boundary:
  - Validate required fields before projection.
  - Reject unsupported entity types with stable error codes.

## Architecture
- Cloud path:
  - Controller -> Use Case -> Repository -> Storage
- POS path:
  - IPC Controller -> Use Case -> Repository -> Storage
- Projection is a dedicated layer in POS sync use case.
- UI reads only repository outputs from projected SQLite tables.

## Error Model (Stable Codes)
- SYNC_VERSION_REGRESSION
- SYNC_ENTITYTYPE_UNSUPPORTED
- TAXONOMY_MISSING_REQUIRED_FIELD
- TAXONOMY_CLOUDID_DUPLICATE
- TAXONOMY_REFERENCE_NOT_FOUND
- RECONCILE_FAILED
- BRANCH_FORBIDDEN
- POS_CATALOG_SNAPSHOT_FAILED
- POS_CATALOG_DELTA_FAILED
- POS_CATALOG_RECONCILE_FAILED
- POS_SYNC_STORAGE_FAILED

Rules:
- Existing stable codes remain unchanged.
- No ad-hoc string-only errors for taxonomy projection paths.

## Observability
- Structured logs only. No runtime console logging in production paths.
- Required fields in projection and sync logs:
  - terminalId
  - branchId
  - syncSessionId
  - operation
  - entityType
  - appliedCounts
  - errorCode when present
- Required counters:
  - snapshot_applied_count_by_entity
  - delta_applied_count_by_entity
  - reconcile_missing_count_by_entity
  - reconcile_outdated_count_by_entity

## Acceptance Criteria
- After first snapshot, POS category picker is dynamic from SQLite and no hardcoded category enum options are used in runtime picker data source.
- Product list and new sale flow resolve category, game, and expansion labels from projected taxonomy tables.
- Disabled or deleted taxonomy entities are not selectable for new operations but historical records remain readable.
- Reconcile reports missing or outdated taxonomy entities and applies safe correction without breaking historical sales views.
- Cross-branch sync leakage is prevented by terminal branch scoping.
- Delta version regression guard prevents epoch or invalid versions from overwriting last valid local version.
- Build gates pass after implementation:
  - npm run build -w apps/desktop
  - npm run build -w apps/cloud-api
  - npm run build -w apps/online-store
  - npm run build -w apps/web
- Future implementation audit command:
  - npm run gov:impl:audit -- "pos-sync-taxonomy-parity-v1"

## Spec Audit Command
npm run gov:spec:audit -- "pos-sync-taxonomy-parity-v1"
