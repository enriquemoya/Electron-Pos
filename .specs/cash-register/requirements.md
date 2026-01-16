# SPEC: Cash Register (Cash Register / Closeout)

## Goal
Allow opening, operating, and closing a cash register in a local-first way, with shift records and cash differences.

## Users
- Cashiers who open/close shifts.
- Management reviewing closeout history.

## Language & i18n (MANDATORY)
- All visible UI text must be in Spanish (MX).
- No hardcoded strings in JSX; use dictionary.
- Examples: "Abrir caja", "Corte de caja", "Efectivo inicial", "Diferencia".

## Core Capabilities
- Open shift with opening cash.
- Associate sales to the active shift.
- See running totals during the shift.
- Close shift with counted cash.
- Calculate difference (expected vs real).
- Store shift history locally.

## Constraints
- SQLite is the source of truth.
- Persistence only via IPC (renderer does not access DB).
- Only one active shift at a time.
- Closed shifts are immutable.
- No remote sync.

## Out of Scope
- Known multiple cash registers concurrently.
- Advanced auditing or digital signatures.
- External deposits/banks.
- Fiscal rules.

## Performance Expectations
- Open/close must be instant.
- In-memory calculations; local persistence with no visible blocking.
