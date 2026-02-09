# Requirements: Online Store Checkout v1

## Problem statement
The online store needs a first checkout flow that can validate cart items,
create orders for in-store payment, and capture pre-order intent without
implementing online payments yet. This must keep the public catalog
non-authoritative while enforcing authoritative inventory at checkout.

## Goals
- Provide a checkout flow that requires authenticated users (JWT).
- Persist a pre-order draft when a user proceeds to checkout.
- Revalidate inventory on session restore and remove invalid items with clear toasts.
- Support "Pay in store" orders with PENDING_PAYMENT status and inventory reservation.
- Expire unpaid pay-in-store orders after 10 natural days and restore inventory.
- Add pickup branch management for admins and branch selection at checkout.
- Keep future payment methods design-ready without implementing them now.
- Treat client-provided price and availability snapshots as non-authoritative.

## Scope
- Online-store checkout UI and UX (mobile-first).
- Cloud API endpoints for pre-order drafts, inventory revalidation, orders,
  and branch management.
- Data model additions for pre-order drafts, orders, order items, branches,
  and inventory reservations/holds.

## Non-goals
- No Stripe or online payment integration.
- No POS synchronization.
- No shipping providers or delivery flows.
- No discounts, promotions, or coupons.
- No admin order fulfillment UI.

## Constraints
- Modules in scope: online-store, cloud-api, data (Prisma).
- Public catalog remains non-authoritative; no quantities exposed publicly.
- Inventory becomes authoritative only at checkout/pre-order stage.
- JWT auth is required for checkout and all order mutations.
- Admin scope limited to branch management only.
- Clean Architecture must be respected in cloud-api.
- All user-facing strings must be localized via next-intl.
- No shared secrets in client components.
- Checkout must rely on server-side inventory reads only.
- Client price/availability snapshots are informational only and must be overridden by server validation.

## Assumptions
- Auth spec is implemented; JWT cookies are available server-side in online-store.
- Inventory admin spec provides authoritative inventory data or will be introduced
  in this spec if missing.
- Existing cart is client-side and can be transitioned to checkout.
- Governance note: AGENT_CONTRACT.md is pending and does not block functional correctness.

## Out of scope
- Payment intents or payment status integrations.
- Order tracking or delivery status workflows.
- Refunds or cancellations initiated by customers.

## i18n
- All checkout UI, toasts, and errors must be localized via next-intl.

## Error handling
- Revalidation errors fall back to a safe state and prompt retry.
- If inventory revalidation removes items, a user-visible toast is required.
- Order creation errors must return localized, user-friendly messages.
- Expiration is idempotent; re-running expiration logic must not double-release inventory.
- Expired pay-in-store orders transition to CANCELLED_EXPIRED and release reservations.
