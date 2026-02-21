# branch-maps-link-and-checkout-location-v1 - Requirements

## Problem Statement
Branch records currently depend on latitude and longitude as operational fields. Checkout and order emails need a direct location link that users can open immediately. The current model adds friction and duplicates location logic across surfaces.

## Objective
Make `googleMapsUrl` the canonical location field for pickup branches so branch location is reusable in:
- Online-store admin branch management
- Checkout branch selection
- Order confirmation email content

## Goals
- Replace branch create and edit data entry from latitude and longitude to a validated Google Maps URL.
- Expose branch map link in checkout with a location icon action that opens a new browser tab.
- Include pickup branch map link in order emails for pickup flows.
- Keep backward compatibility during rollout with additive schema and API changes.

## Scope
- apps/cloud-api:
  - Branch create and update validation for `googleMapsUrl`.
  - Branch repository and API response mapping.
  - Checkout order data used by email templates includes branch map link.
- apps/online-store:
  - Admin branches form and table consume `googleMapsUrl`.
  - Checkout branch selector renders map action icon and external open behavior.
  - i18n labels for map fields and checkout map action in ES and EN.
- data:
  - Additive Prisma change for branch map URL.
  - Safe migration and backfill plan from existing coordinates.

## Non-Goals
- No redesign of checkout payment, cart, or order state flows.
- No change to POS runtime behavior in this slug.
- No geocoding service integration.
- No branch routing optimization logic.

## Constraints and Assumptions
- Cloud API remains the source of truth for branch location data.
- Online-store locale behavior remains URL based (`/es`, `/en`) only.
- Existing branch records may have valid coordinates but no map URL yet.
- Migration must be additive and safe.

## Actors and Roles
- Admin:
  - Creates and edits branches with `googleMapsUrl`.
  - Views branch location links in admin branch list and edit modal.
- Checkout customer:
  - Selects pickup branch and can open branch map in new tab.
- System email flow:
  - Includes pickup branch map URL when pickup branch exists.

## Functional Requirements
### Branch Data Entry
- Branch create flow requires:
  - `name`
  - `city`
  - `address`
  - `googleMapsUrl`
- Branch update flow supports updating `googleMapsUrl`.
- Latitude and longitude are no longer required input fields in admin UI.

### Google Maps URL Validation
- Accept only HTTPS Google Maps links.
- Allowed host patterns:
  - `maps.google.com`
  - `www.google.com` with maps path
  - `maps.app.goo.gl`
- Reject malformed URLs and unsupported hosts with stable validation error.

### Admin Branch List Behavior
- Branch list displays location action for each row using stored `googleMapsUrl`.
- Edit modal preloads current `googleMapsUrl`.
- Create and edit operations continue to require explicit confirmation dialog before submit.

### Checkout Behavior
- Branch selector remains unchanged for selection semantics.
- For selected branch, checkout shows a location icon action.
- Location icon opens `googleMapsUrl` in a new tab with secure rel attributes.
- If a branch has no map link during migration window, checkout hides map action and shows fallback text.

### Email Behavior
- Order created email for pickup orders includes:
  - Pickup branch name
  - Clickable map link using `googleMapsUrl`
- If map URL is missing, email renders branch name without map CTA.

### Backward Compatibility
- API responses remain additive.
- Existing consumers that still read latitude and longitude are not hard-broken in this slug.
- `googleMapsUrl` becomes canonical for new UI behavior and new branch writes.

## Data Model
### Prisma Model Changes
- `PickupBranch` adds:
  - `googleMapsUrl String? @map("google_maps_url")`
- Latitude and longitude remain in schema during transition, but are deprecated for operational use in online-store flows.

### Migration and Backfill
- Additive migration adds nullable `google_maps_url` column.
- Backfill strategy:
  - For rows with valid latitude and longitude and null `google_maps_url`, generate URL using:
    - `https://www.google.com/maps?q=<lat>,<lng>`
- No destructive column removal in this slug.

## Security
- Validate URL host allowlist server-side.
- Never trust client-side URL validation alone.
- Escape and render links safely in email and web UI.
- Use `target="_blank"` with `rel="noopener noreferrer"` for checkout map action.
- No shared secrets in client components.

## Architecture
- Cloud API chain:
  - Controller -> Use Case -> Repository -> Storage
- Online-store chain:
  - Route/Page -> Server API client -> UI Component
- Email chain:
  - Checkout Use Case -> Email template rendering

## Error Model
Stable codes to add or reuse consistently:
- `BRANCH_INVALID_MAP_URL`
- `BRANCH_CREATE_FAILED`
- `BRANCH_UPDATE_FAILED`
- `CHECKOUT_BRANCH_NOT_FOUND`
- `EMAIL_RENDER_FAILED` (reuse existing email failure path if already defined)

Rules:
- No ad-hoc string-only error payloads for map URL validation.
- Existing branch and checkout error codes remain valid.

## Observability
Required structured fields for branch write and checkout map usage logs:
- `branchId`
- `actorUserId`
- `operation`
- `googleMapsUrlHost`
- `errorCode` when present

Recommended counters:
- `branch_map_url_create_count`
- `branch_map_url_update_count`
- `checkout_map_link_open_count` (client analytics if available)
- `branch_map_url_validation_error_count`

## Acceptance Criteria
1. Admin can create and edit a branch using `googleMapsUrl` without latitude and longitude input.
2. Invalid map URL host is rejected with stable error code.
3. Branch list and edit modal display and persist `googleMapsUrl` correctly.
4. Checkout shows location icon for selected branch and opens link in new tab safely.
5. Order created email includes branch map link when available.
6. Migration is additive and backfills map URLs from coordinates where possible.
7. Build gates pass after implementation:
   - `npm run build -w apps/cloud-api`
   - `npm run build -w apps/online-store`
   - `npm run build -w apps/web`
8. Future implementation audit command:
   - `npm run gov:impl:audit -- "branch-maps-link-and-checkout-location-v1"`

## Spec Audit Command
npm run gov:spec:audit -- "branch-maps-link-and-checkout-location-v1"
