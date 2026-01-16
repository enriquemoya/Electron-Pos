# SPEC: Store Credit (Store Credit)

## Goal
Manage customers and store credit balance, allowing credit grants and usage in sales without allowing negative balances.

## Users
- Cashiers applying credit in sales.
- Management recording movements and viewing history.

## Language & i18n (MANDATORY)
- All visible UI text must be in Spanish (MX).
- No hardcoded strings in JSX; use dictionary.
- Examples: "Credito de tienda", "Cliente", "Saldo disponible", "Agregar credito".

## Customer Rules
- Fields: First name(s), Paternal last name, Maternal last name, Birth date, Address, Phone, Email.
- At least one must exist: Phone or Email.
- Phone must be unique if provided.
- Email must be unique if provided.
- Do not allow create/update if:
  - Phone empty and Email empty.
  - Duplicate phone.
  - Duplicate email.

## Core Capabilities
- Create and edit customers.
- Search customer by Phone or Email.
- Grant credit with reason and reference.
- Use credit as payment method.
- View movement history.

## Credit Rules
- Balance can never be negative.
- Every balance change is recorded as a movement.
- Reasons: tournament win, special event, sale (usage).

## Constraints
- SQLite is the source of truth.
- Persistence only via IPC (renderer does not access DB).
- No remote sync.

## Out of Scope
- Loyalty program.
- Automatic promotions.
- Third-party integrations.

## Performance Expectations
- Search and validations must be instant locally.
