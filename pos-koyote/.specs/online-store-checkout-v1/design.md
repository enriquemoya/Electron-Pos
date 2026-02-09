# Design: Online Store Checkout v1

## High-level architecture
- Online-store provides checkout UI and server actions/route handlers to call Cloud API.
- Cloud API exposes authenticated endpoints for pre-order drafts, revalidation, orders,
  and branch management.
- Prisma is the only data access layer in cloud-api.
- Clean Architecture layers apply in cloud-api (controllers -> use cases -> domain -> infra).

## Data flow
1. User proceeds to checkout from cart.
2. Online-store calls Cloud API to create or update a pre-order draft.
3. Cloud API validates items against authoritative inventory and stores draft items.
4. On session restore (cart or checkout load), online-store calls revalidation endpoint.
5. Cloud API removes invalid items and returns a normalized list + removed items.
6. Online-store updates cart/draft and shows a toast for removed items.
7. User selects pickup branch and chooses "Pay in store".
8. Cloud API creates an order with PENDING_PAYMENT and reserves inventory.

## State ownership
- Cart: client-side localStorage.
- Pre-order draft: Cloud API (authoritative for checkout state).
- Orders and reservations: Cloud API.

## Data model additions (Prisma)
### PickupBranch
- id (uuid)
- name (string)
- address (string)
- city (string)
- latitude (decimal)
- longitude (decimal)
- imageUrl (string, optional)
- createdAt, updatedAt

### PreorderDraft
- id (uuid)
- userId (uuid)
- status (enum: ACTIVE, CONVERTED, EXPIRED)
- createdAt, updatedAt
- items relation

### PreorderDraftItem
- id (uuid)
- draftId (uuid)
- productId (string)
- quantity (int)
- priceSnapshot (decimal)
- currency (string)
- availabilitySnapshot (string)
- createdAt, updatedAt

### OnlineOrder
- id (uuid)
- userId (uuid)
- status (enum: PENDING_PAYMENT, PAID, CANCELED, CANCELLED_EXPIRED)
- paymentMethod (enum: PAY_IN_STORE)
- pickupBranchId (uuid, nullable)
- subtotal (decimal)
- currency (string)
- expiresAt (datetime)
- createdAt, updatedAt
- items relation

### OnlineOrderItem
- id (uuid)
- orderId (uuid)
- productId (string)
- quantity (int)
- priceSnapshot (decimal)
- currency (string)
- availabilitySnapshot (string)

### InventoryReservation
- id (uuid)
- orderId (uuid)
- productId (string)
- quantity (int)
- status (enum: ACTIVE, RELEASED)
- expiresAt (datetime)
- createdAt

## Inventory authority
- Public catalog remains semantic-only and does not expose quantities.
- Checkout uses authoritative inventory reads from cloud-api only.
- The authoritative inventory model is defined in inventory-admin-dashboard-v1
  and must be reused; no new parallel inventory source is allowed.
- Client availabilitySnapshot is informational only and must never be trusted.

## API contracts (Cloud API)
All endpoints require JWT auth unless stated.

### POST /checkout/drafts
Create or update the active pre-order draft for the user.
- Input: items[] with productId, quantity, priceSnapshot, availabilitySnapshot
- Output: draftId, normalized items, removedItems[]
- Server MUST re-fetch current product price from authoritative catalog data,
  re-derive availability from authoritative inventory, and override any
  client-provided snapshot values before persisting draft items.

### POST /checkout/revalidate
Revalidate cart/draft items against authoritative inventory.
- Input: items[] with productId and quantity
- Output: validItems[], removedItems[]

### POST /checkout/orders
Create an order for checkout (pay_in_store only).
- Input: draftId, pickupBranchId, paymentMethod=PAY_IN_STORE
- Output: orderId, status, expiresAt

### GET /branches
Public read-only list of pickup branches.

### Admin branch management (admin only)
- GET /admin/branches
- POST /admin/branches
- PATCH /admin/branches/:id
- DELETE /admin/branches/:id

## Order expiration mechanism
- expiresAt = createdAt + 10 natural days (calendar days).
- Expiration applies only to unpaid pay-in-store orders (PENDING_PAYMENT).
- On any order read or admin list access, Cloud API runs an idempotent expiration check
  for PENDING_PAYMENT orders where expiresAt < now.
- Expired orders are marked CANCELLED_EXPIRED, and inventory reservations are released.
- Primary mechanism: lazy expiration on access (read/update/order list).
- Secondary mechanism: scheduled job/cron is allowed but not required in v1.

## Checkout UX
- Mobile-first checkout page.
- Distinguish "Pay now" (future) vs "Pay in store" (current).
- Show toasts when items are removed during revalidation.
- No silent cart mutations.

## Edge cases
- Missing inventory data -> item treated as unavailable and removed during revalidation.
- Duplicate items in cart -> normalized on the server.
- Preorder draft conversion is idempotent; repeated checkout submissions do not create
  duplicate orders.
- If branch selection is invalid, reject order creation with a localized error.

## i18n and accessibility
- All labels, errors, toasts, and empty states localized via next-intl.
- Dialogs and toasts must be keyboard accessible.
