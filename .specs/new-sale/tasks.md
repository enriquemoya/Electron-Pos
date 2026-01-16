# Tasks: New Sale (POS Flow)

## Phase 1 - Domain Foundation
- Define Sale and SaleItem in packages/core
- Total calculation utilities
- i18n base (es-MX)

## Phase 2 - UI Skeleton
- New Sale route
- Empty cart
- Base product list
- Localized text in dictionary

## Phase 3 - Interaction
- Add items to cart
- Update quantities
- Real-time total

## Phase 4 - Search Default State
- Show top 5 popular products when search is empty
- Fallback to 5 most recent if no data

## Phase 5 - Cart Layout
- Cart column with fixed height
- Scroll only in item list
- Total, payments, and buttons visible

## Phase 6 - Store Credit UX
- Customer with credit section
- Search with minimum 5 characters
- Helper message when below minimum
- Block confirmation without customer or sufficient balance

## Phase 7 - Persistence
- Save sale in SQLite via IPC
- Clear state after completion

## Phase 8 - UX Polish
- Keyboard shortcuts
- Loading states
- Inline messages
