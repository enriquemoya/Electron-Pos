# branch-maps-link-and-checkout-location-v1 - Tasks

## Phase 1 - Contract and Dependency Audit
- [ ] Identify all branch read and write paths that use `latitude` and `longitude`.
- [ ] Identify checkout UI branch rendering path and selected-branch metadata usage.
- [ ] Identify order email data source for pickup branch fields.
- [ ] Confirm additive API strategy for branch payload.

## Phase 2 - Data Model and Migration
- [ ] Add `google_maps_url` to Prisma `PickupBranch` as nullable field.
- [ ] Generate additive migration for schema change.
- [ ] Add backfill step to populate `google_maps_url` from existing coordinates.
- [ ] Preserve latitude and longitude columns as transitional fields.

## Phase 3 - Cloud API Branch Contracts
- [ ] Extend branch repository mapping to include `googleMapsUrl`.
- [ ] Update branch create and update validation to accept and validate map URL.
- [ ] Enforce URL host allowlist and stable `BRANCH_INVALID_MAP_URL` response.
- [ ] Keep branch response payload backward compatible.

## Phase 4 - Online-store Admin Branches UX
- [ ] Replace latitude and longitude form inputs with map URL input in create and edit modal.
- [ ] Keep confirmation dialog before create and before edit submit.
- [ ] Show map link action in branch DataTable rows.
- [ ] Keep delete confirmation flow unchanged.
- [ ] Add ES and EN i18n keys for new labels and errors.

## Phase 5 - Checkout Location Action
- [ ] Extend checkout branch type to include `googleMapsUrl`.
- [ ] Add location icon action near selected branch data.
- [ ] Open link in new tab with secure rel attributes.
- [ ] Add fallback text when map URL is missing.
- [ ] Add accessibility label for location action.

## Phase 6 - Email Template Integration
- [ ] Extend checkout order creation return shape with pickup branch map URL.
- [ ] Update order email template to include map CTA when URL exists.
- [ ] Keep branch name-only rendering when URL is missing.

## Phase 7 - Validation and Audit Gates
- [ ] Run migrations and builds:
  - [ ] `npm run prisma:generate -w apps/cloud-api`
  - [ ] `npm run build -w apps/cloud-api`
  - [ ] `npm run build -w apps/online-store`
  - [ ] `npm run build -w apps/web`
- [ ] Run governance audit:
  - [ ] `npm run gov:impl:audit -- "branch-maps-link-and-checkout-location-v1"`

## Runtime Verification Checklist
- [ ] Admin creates branch with valid Google Maps URL.
- [ ] Admin update rejects invalid URL host with stable code.
- [ ] Checkout selected branch shows location icon and opens map URL.
- [ ] Checkout fallback renders when branch has no map URL.
- [ ] Order email includes map CTA when map URL exists.

## Guard Searches
- [ ] Find coordinate-only dependencies to be replaced in online-store branch flows:
  - [ ] `rg -n "latitude|longitude" apps/online-store/src/app/[locale]/admin/branches apps/online-store/src/components/admin -S`
- [ ] Ensure map URL appears in branch contracts:
  - [ ] `rg -n "googleMapsUrl|google_maps_url" apps/cloud-api/src apps/online-store/src -S`
- [ ] Ensure no unsafe external open usage:
  - [ ] `rg -n "target=\"_blank\"" apps/online-store/src -S`

## Spec Audit Command
- [ ] `npm run gov:spec:audit -- "branch-maps-link-and-checkout-location-v1"`
