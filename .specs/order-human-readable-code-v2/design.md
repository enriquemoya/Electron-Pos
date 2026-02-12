SPEC: order-human-readable-code-v2

Data model
- Prisma: OnlineOrder gains:
  - orderNumber Int @unique
  - orderCode String @unique
- Global DB sequence: order_number_seq.
- orderNumber default uses nextval from sequence at insert time.

Prefix normalization
- Input: branch name string (or empty).
- Steps: remove accents, remove spaces, uppercase, take first 3 chars.
- If empty after normalization, fallback to "ONL".
- Prefix for online/shipping: "ONL".
- Prefix for pickup: normalized branch prefix.

OrderCode format
- orderCode = `${prefix}-${orderNumber.toString().padStart(6, "0")}`.
- If orderNumber > 999999, no truncation (full number string).

Generation flow (cloud-api)
1) Start transaction.
2) Create order with orderNumber from sequence.
3) Compute orderCode and update order within same transaction.
4) Return order with orderCode in response.

Backfill and migration
- Migration must:
  - Create sequence.
  - Add orderNumber/orderCode columns nullable.
  - Backfill existing orders with incremental orderNumber ordered by createdAt (stable).
  - Set orderCode to "ONL-<padded>" for existing orders.
  - Enforce NOT NULL and UNIQUE after backfill.

API and queries
- Add orderCode to DTOs and response serializers.
- Admin search:
  - If input matches /^\\d+$/ => exact orderNumber.
  - If input contains "-" or letters => match orderCode exact or prefix.
  - Partial prefix match: orderCode startsWith query.
- No contract breaking: only additive fields.

Online-store UI
- Replace UUID display with orderCode in:
  - Order detail
  - Order history
  - Checkout confirmation
  - Toast confirmation
- Keep UUID only internally if needed for API routes.

Emails
- Update subjects and templates to include orderCode.
- Use orderCode in body where order id is shown.

Edge cases
- Orders without branch name: prefix ONL.
- Branch name shorter than 3 chars: use available chars.
- Legacy orders missing orderNumber before backfill: treat as server error if accessed (should not happen post-migration).
