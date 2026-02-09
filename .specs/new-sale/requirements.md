# SPEC: New Sale (POS Flow)

## Goal
Allow store staff to register a new sale quickly and reliably in a physical TCG store.

## User
- Cashier or store staff
- Uses keyboard and mouse (touch later)

## Core Requirements
- Start a new sale
- Add products to the cart
- Increase or decrease quantities
- Remove items
- See total in real time
- Confirm sale
- Clear state after completion

## Language & Localization (MANDATORY)
- All UI text must be in Spanish (Mexico).
- No hardcoded strings in components.
- All text must be i18n-ready.

Examples:
- "Nueva venta"
- "Agregar producto"
- "Total"
- "Confirmar venta"

## Product Search Default State
- When the search input is empty:
  - Show only the top 5 most popular products.
  - Popularity = total units sold historically.
  - If no popularity data exists:
    - Show the 5 most recent products (by creation date).
- When the user types:
  - Use the current search behavior.

## Store Credit UX (Store Credit)
- If the method is "Store Credit":
  - Show the "Customer with credit" section.
  - Must include:
    - Search input (phone, email, or name).
    - Results list.
    - Selected customer card.
    - Available balance.

Rules:
- Do not show customers by default.
- Search only when the user types 5 or more characters.
- If there are fewer than 5 characters, show helper text:
  - "Escribe al menos 5 caracteres para buscar".
- Do not allow confirm if:
  - No customer selected.
  - Balance < total.
  - Cart is empty.

## Constraints
- Local-first (no internet required)
- Must work offline
- No authentication in MVP
- No payment gateway
- No CFDI

## Non-Goals (Out of Scope)
- Returns
- Discounts
- Tax breakdown
- Multi-currency
- Advanced customer profiles

## Performance Expectations
- Instant interactions
- No blocking network calls
- State managed locally
