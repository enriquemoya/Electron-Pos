# branch-maps-link-and-checkout-location-v1 - Design

## Current Gap
Branch location data is modeled as coordinates and reused inconsistently. Checkout and emails need a direct map link, but the system does not provide a canonical branch URL field for location actions.

## Design Intent
Promote `googleMapsUrl` to canonical location value for branch UX while keeping coordinate fields as temporary legacy data during migration.

## Scope Boundaries
- In scope:
  - Branch data contract update
  - Admin branch create and edit modal field update
  - Checkout map icon action
  - Email map link rendering
  - Additive migration and backfill
- Out of scope:
  - POS feature work
  - geolocation services
  - branch ranking logic

## Architecture Chain
### Cloud API
Controller -> Use Case -> Repository -> Storage

### Online-store
Page/Route -> Server API client -> React component

### Email Flow
Checkout use case -> renderOrderCreatedEmail -> transport provider

## Data Model Strategy
### Canonical Field
- Canonical location field for branch flows:
  - `googleMapsUrl`

### Transitional Fields
- `latitude` and `longitude` remain stored short-term.
- New online-store flows should not depend on them.

### Migration Plan
1. Add `google_maps_url` nullable column.
2. Backfill URL from coordinate pairs where both values exist.
3. Keep old columns for compatibility in this slug.
4. Mark coordinate-based write paths deprecated.

## API Contract Design
### Branch Read Contract
Branch read payload includes:
- `id`
- `name`
- `address`
- `city`
- `imageUrl`
- `googleMapsUrl`
- legacy `latitude`, `longitude` (transitional)

### Branch Write Contract
Create and update payload supports:
- `name`
- `address`
- `city`
- `imageUrl`
- `googleMapsUrl`

Validation rules:
- URL is required for create.
- URL optional for update, but if provided it must pass host allowlist validation.

## Validation and Sanitization
### URL Validation
- Parse using standard URL parser.
- Require `https` protocol.
- Allowed hosts:
  - `maps.google.com`
  - `www.google.com` with `/maps` path
  - `maps.app.goo.gl`

### Normalization
- Trim whitespace.
- Persist normalized URL string.

## Online-store UI Design
### Admin Branches Page
- DataTable-based list remains primary list surface.
- Row actions:
  - Edit in modal
  - Delete confirmation
- Create and edit modal fields:
  - name
  - city
  - address
  - image
  - google maps URL
- Submit flow:
  1. Open confirm dialog
  2. Confirm and execute server action
  3. Toast success or error

### Checkout Branch Selector
- Selected branch section includes location icon button.
- On click:
  - open `googleMapsUrl` in new tab
  - use `noopener` and `noreferrer`
- If URL missing:
  - hide icon button
  - show localized fallback note

## Email Template Design
### Order Created Email
- When pickup branch exists:
  - show branch name as today
  - if `googleMapsUrl` exists, show CTA link/button to open map
- If URL missing, render branch name only.

## State Ownership
- Cloud API owns branch location source of truth.
- Online-store renders map links but does not derive URLs from coordinates.
- Email template receives map URL from checkout repository/use case output.

## Error and Edge Cases
- Invalid URL host on branch create or update:
  - return stable `BRANCH_INVALID_MAP_URL`
- Missing map URL for legacy branch in checkout:
  - no crash
  - map action hidden
- Missing pickup branch on order creation:
  - existing checkout error path remains

## Security Considerations
- Server-side URL allowlist is mandatory.
- Prevent unsafe external link injection.
- Avoid exposing internal-only URLs in public payloads.

## i18n and Accessibility Notes
- Add localized labels in ES and EN for:
  - maps URL field
  - open location action
  - fallback message when location link missing
- Location icon button must include accessible `aria-label` in both locales.
- Keep keyboard accessibility for icon button and modal confirmations.

## Observability Strategy
Log events:
- branch create and update with map URL host metadata
- checkout map action render state (hasLink true or false)
- email render map CTA inclusion state

Example structured log:
{
  "event": "branch_map_url_updated",
  "branchId": "branch_123",
  "actorUserId": "user_456",
  "googleMapsUrlHost": "maps.google.com",
  "errorCode": null
}

## Compatibility Notes
- Existing consumers that rely on coordinates remain supported during transition.
- New consumers should only use `googleMapsUrl` for map actions.
