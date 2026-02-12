SPEC: order-human-readable-code-v2

Phase 1: Spec audit
- Run spec audit and address blocking items.

Phase 2: Data model and migration
- Update Prisma schema with orderNumber/orderCode.
- Create migration:
  - sequence create
  - add nullable columns
  - backfill in stable order
  - enforce NOT NULL and UNIQUE
- Regenerate Prisma client.

Phase 3: cloud-api implementation
- Add normalization helper for prefix.
- Update order creation flow to set orderNumber/orderCode in transaction.
- Update DTOs and serializers to include orderCode.
- Update admin search to support orderCode/orderNumber.
- Update email payloads to include orderCode.

Phase 4: online-store UI
- Replace visible UUID with orderCode in UI components.
- Ensure locale strings are updated.

Phase 5: Verification
- Run tests or manual checks:
  - Create order -> orderCode present.
  - Search by orderCode and orderNumber.
  - Existing orders have orderCode.
  - Emails contain orderCode.

Phase 6: Implementation audit
- Run impl audit and resolve findings.
