# Design: New Sale (POS Flow)

## High-Level Flow
1. The cashier opens "Nueva venta"
2. The sale starts empty
3. Products are added to the cart
4. Quantities are adjusted
5. The total is recalculated on every change
6. The sale is confirmed
7. The sale is persisted locally
8. The UI returns to the initial state

## UI Responsibilities (Front-End Agent)
- Render list or search results
- Render cart items
- Show totals
- Capture user actions
- No business logic

## Domain Responsibilities (Back-End Agent)
- Sale model
- Add and remove items
- Calculate totals
- Validate sale before persisting

## Domain Models (Draft)
- Sale
  - id
  - items[]
  - total
  - createdAt

- SaleItem
  - productId
  - name
  - price
  - quantity
  - lineTotal

## Product Search Default State
- Empty input:
  - Show 5 most popular products (by units sold).
  - If no popularity, show 5 most recent products.
- With text:
  - Use the current name search.

## Cart Layout Behavior
- The cart column has fixed height relative to the viewport.
- The item list is the only section that scrolls.
- Total, payment method, and actions stay visible.

## Payment Method: Store Credit
- Show "Customer with credit" section when the method is Store Credit.
- The section includes:
  - Search input (phone, email, or name).
  - Results list.
  - Selected customer card.
  - Available balance.

Search rules:
- Do not show customers by default.
- Run search only with 5 or more characters.
- If fewer than 5 characters, show helper text:
  - "Escribe al menos 5 caracteres para buscar".

## Visual Rules
- Disabled or pending states must be obvious.
- The customer card must show:
  - Full name
  - Phone or email
  - Available balance

## Data Persistence
- SQLite via packages/db
- Sale saved atomically
- No sync in this phase

## Error Handling
- Block negative quantities
- Block empty sale
- Block confirmation if Store Credit requirements are missing

## Future Extensions
- Discounts
- Taxes
- Additional payment methods
- Advanced printing

## Localization Strategy
- UI text centralized in dictionary.
- Spanish (Mexico) as default.
- Prepared for other languages.

## UI Rules (Language)
- No hardcoded strings in JSX.
- Labels, buttons, and messages from dictionary.
