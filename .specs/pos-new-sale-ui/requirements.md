# SPEC: POS New Sale UI

## Goal
Provide the current /new-sale screen for running a fast POS checkout.

## Scope
- Product search and list from IPC.
- Cart management (add, increase/decrease, remove).
- Running total recalculated on changes.
- Confirm sale via IPC and reset UI state.

## Constraints
- Renderer uses IPC only: window.api.products, window.api.inventory, window.api.sales.
- Inventory updates are performed via IPC on confirm.
- No discounts, taxes, or payments.
- Spanish (MX) UI strings via dictionary only.

## Out of Scope
- Returns/refunds
- Payment gateways
- Tax breakdowns
- Customer profiles
