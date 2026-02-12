SPEC: order-human-readable-code-v2

Goal
- Add human-readable orderCode derived from a global incremental orderNumber.
- Preserve UUID as primary key and internal reference.
- Make orderCode visible in online-store UI and emails.

Scope
- cloud-api: data model, generation, queries, responses, emails.
- data: Prisma schema, migration, backfill.
- online-store: display orderCode instead of UUID in user-facing UI.

Non-goals
- No change to order lifecycle or business rules.
- No change to auth/session behavior.
- No change to external API routes or response shapes beyond adding new fields.
- No changes to POS or IPC.

Constraints
- UUID remains primary key.
- orderNumber is a global incremental Int (no per-branch reset).
- orderCode format: <PREFIX>-<PADDED_NUMBER>.
- Prefix rules:
  - Online/shipping: ONL
  - Branch pickup: first 3 uppercase letters of normalized branch name.
  - Normalization: uppercase, remove spaces and accents, length 1..3.
- Padding: padStart(6, "0"). If number > 999999, display full number.
- Must be transaction-safe and concurrency-safe.
- Must support existing data backfill without breaking foreign keys.
- ASCII-only and English-only governance text.

i18n
- All user-visible text remains localized for /es and /en.
- No locale detection changes.

Error handling
- Generation must be atomic; if sequence fails, order creation must fail and report a server error.
- Search must handle missing orderCode/orderNumber gracefully for legacy data.

Security
- No client exposure of shared secrets.
- UUID must not be shown in online-store UI.

Acceptance
- orderNumber and orderCode exist for all orders (new and existing).
- All API responses that expose order data include orderCode.
- Admin search supports exact orderCode, partial prefix, and exact orderNumber.
- Online-store order views display orderCode.
- Emails reference orderCode in subject and body.
