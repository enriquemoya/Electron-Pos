# Requirements: Online Store Cart v1

## Problem statement
The online store needs a cart experience so shoppers can collect items,
review quantities, and navigate toward future checkout. This must be
client-side only, mobile-first, and use the existing read-only catalog data.

## Goals
- Provide a cart drawer accessible from any page.
- Provide a cart page at /{locale}/cart.
- Persist cart state client-side via localStorage.
- Add a cart icon to the header; mobile uses icon-only (no text label).
- Cart drawer is full screen on mobile and max-w-md (448px) on desktop.
- Enforce quantity constraints based on semantic availability only.
- Show a clear "pending sync" message when availability is unknown.
- Keep all server-only calls on the server (no secrets in client components).
- Use shadcn UI, Tailwind, and lucide icons only.
- Use next-intl for all user-facing strings.
- Add-to-cart entrypoints on PDP, catalog product cards, and featured cards.
- Card add-to-cart uses compact quantity input with +/- and a small yellow cart icon button.

## Scope
- Online-store UI only.
- Client-side cart state (localStorage) with React context or store.
- Cart drawer UI and cart page UI.
- Add-to-cart entrypoints within PDP, catalog product cards, and featured cards (including landing featured grid).

## Non-goals
- No checkout, payments, shipping, or taxes.
- No server-side cart storage.
- No Cloud API changes.
- No inventory reservations or stock guarantees.
- No POS changes.
- No admin features.

## Constraints
- Online-store only.
- Read-only catalog data; no Cloud API changes or secrets in client.
- LocalStorage is the source of truth for cart persistence.
- Cart must be available to anonymous users.
- Use Next.js App Router with shadcn UI + Tailwind + lucide.
- All strings localized via next-intl.
- Locale remains URL-only (/es, /en); default es.
- Semantic availability only (in_stock, low_stock, out_of_stock, pending_sync, unknown).

## Assumptions
- Product data is already fetched server-side and can be passed into client components.
- Currency is MXN and prices are displayed as provided in read-only data.
- Add-to-cart entrypoints exist or can be added minimally without changing data flows.

## Out of scope
- Share link is optional and not required for v1.
- Authentication and user accounts are not required for cart usage.

## i18n
- All labels, helper text, errors, and empty states must be localized via next-intl.

## Error handling
- LocalStorage read/write failures fall back to an empty cart.
- Invalid or missing cart data resets to a safe empty state.
- Availability unknown should show a non-blocking warning message.
