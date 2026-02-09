# Tournaments (Tournaments) - Requirements

## Goal
Allow managing TCG tournaments in the store, registering participants, selling entries as sales, and awarding prizes (store credit or products) with local traceability.

## Users
- Store owner
- POS staff
- Event staff

## Language and i18n
- All UI in Spanish (MX).
- No hardcoded text in UI; use dictionary.

## Core Capabilities
- Create and edit tournaments with: name, game, date, max capacity, entry price.
- Configure winner count (1 to 8) when creating/editing a tournament.
- Configure prize distribution by position (1..8), amounts per winner.
- Register participants (with or without existing customer).
- Prevent duplicate participant registration.
- Quick customer registration from the participant flow when not found.
- Sell entry as an intangible product (appears in sales, cash register, daily reports).
- Close tournament and assign winner(s).
- Award prizes:
  - Store credit
  - Product
  - Mixed
- Record credit movements for tournaments with reference to the tournament.
- Tournament list uses Shadcn DataTable with server-side pagination.
- Provide tournament list filters (date range, game, participant count).
- Sorting for list: date, game, participants count.
- Allow deletion only if no winners recorded and no entry sales exist.

## Constraints
- Local-first: SQLite is the source of truth.
- Data access only via IPC.
- No external APIs.
- A tournament cannot exceed capacity.
- Winners must match the configured count before closing.
- Deletion is blocked if entry sales exist or winners were assigned.

## Out of Scope
- Brackets or pairings.
- Advanced competitive rankings.
- Online registration.
- External payments (POS flow only).

## Performance
- Tournament list should load in < 1s with 1,000 records.
- Participant registration in < 200ms per local operation.
