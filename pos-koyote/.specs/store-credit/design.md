# Design: Store Credit (Store Credit)

## Customer Model
- Customer:
  - id
  - firstName
  - lastName
  - maternalName
  - birthDate
  - address
  - phone (unique, nullable)
  - email (unique, nullable)
  - createdAt
  - updatedAt

## Credit & Movement Model
- CreditBalance:
  - customerId
  - balance

- CreditMovement:
  - id
  - customerId
  - date
  - amount (+/-)
  - reason
  - reference (sale, tournament, event)

## Validation Rules
- phone/email: at least one required.
- phone/email: unique if present.
- balance cannot be negative.

## Sale-Credit Integration
- If the method is CREDITO_TIENDA:
  - Customer selection is required.
  - Show available balance.
  - Block sale if balance insufficient.
  - Record negative movement with sale reference.

## UI Flows
- Create/edit customer.
- Search customer by phone or email.
- Grant credit with reason and reference.
- Use credit in sale.
- View movement history per customer.

## Responsibilities
- Domain (packages/core):
  - Customer and credit models and validations.
  - Balance rules.
- DB (packages/db):
  - customers, credit_balance, credit_movements tables.
- IPC (apps/desktop):
  - Customer CRUD.
  - Add movement and recalculate balance.
- UI (apps/web):
  - Forms, search, history.
  - Integration with sale flow.

## IPC Usage
- Renderer only uses window.api.*
- No direct SQLite access.

## Error Handling
- Inline messages for validations.
- Block sale if balance insufficient.

## Persistence Strategy
- SQLite stores customers, balances, and movements.
- Movements are the source for balance auditing.

## Future Extensions
- Statement delivery.
- Expiration rules.
- Per-customer limits.
