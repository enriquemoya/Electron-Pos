# Tasks: Store Credit (Store Credit)

## Phase 1 - Domain
- Customer, CreditBalance, CreditMovement models.
- Phone/email validations.
- Non-negative balance rules.

## Phase 2 - Persistence
- Create customers, credit_balance, credit_movements tables.
- Unique indexes for phone and email.

## Phase 3 - IPC
- Customer CRUD.
- Record movements and recalculate balance.
- Query movement history.

## Phase 4 - UI
- Customer management (create/edit/search).
- Balance and movement view.
- Forms with validations.

## Phase 5 - Sales Integration
- Customer selection when method is credit.
- Validate available balance.
- Record negative movement on sale.

## Phase 6 - Validation & UX
- Inline messages.
- Loading states.
- Basic shortcuts.
