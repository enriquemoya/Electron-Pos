# Tournaments (Tournaments) - Design

## Core Concepts
### Tournament
- id
- name
- game
- date
- maxCapacity
- entryPrice (Money)
- prizeType (STORE_CREDIT | PRODUCT | MIXED)
- prizeValue (Money)
- winnerCount (1..8)
- prizeDistribution (list of positions with amounts)
- status (DRAFT | OPEN | CLOSED)

### Participant
- id
- tournamentId
- displayName
- customerId (optional)
- registeredAt

### Prize
- tournamentId
- winnerIds
- creditAmount (optional)
- productNotes (optional)

## Rules
- Only one tournament in OPEN state can accept participants.
- Do not allow registering more participants than max capacity.
- Do not allow the same participant to be registered twice.
- CLOSED tournaments are immutable (read-only).
- Entry sales must be linked to the tournament.
- Closing requires selecting exactly N winners (winnerCount).
- prizeDistribution length must equal winnerCount.
- Each prize position amount is >= 0 and may differ by position.
- If prizeType is STORE_CREDIT or MIXED, credit per winner equals the position amount.
- If prizeType is PRODUCT or MIXED, winners are still recorded by position (amount may be 0).
- Deletion is blocked if winners exist or entry sales exist.

## High-Level Flow
1) Create tournament (DRAFT) and navigate to detail.
2) Open tournament (OPEN).
3) Register participants.
4) Sell entries (POS sale linked to tournament).
5) Close tournament (CLOSED).
6) Assign exactly N winners by position and grant prizes.

## Sales Integration
- Entry is an intangible product.
- Sale stores tournamentId as reference.
- Sale appears in history, cash register, and daily reports.

## Store Credit Integration
- Credit prizes generate movement:
  - reason: `Tournament <name>`
  - referenceType: TOURNAMENT
  - referenceId: tournamentId

## UI and Responsibilities
- UI:
  - Tournament list with Shadcn DataTable, server-side pagination, filters, and sorting
  - Tournament detail in tabs:
    - Details
    - Participants
    - Entry sales
    - Winners
  - Participant registration with search + selected card
  - Quick customer registration modal when not found
  - Entry sale
  - Winner assignment with multi-select and validation
- Domain:
  - Capacity and status validations
  - Prize rules, distribution, and winner count validation
- Persistence:
  - SQLite repositories
- Integrations:
  - Use IPC for sales and credit

## Error Handling
- Inline messages, no alerts.
- Common errors:
  - Capacity full
  - Tournament closed
  - Duplicate participant
  - Winner count mismatch
  - Invalid prize

## Persistence
- Suggested tables:
  - tournaments
  - tournament_participants
  - tournament_prizes
  - sale_tournaments (if applicable)
- Indexes by date and status.

## Participant Assignment UX
- Search by phone, email, or name.
- Show result list and a selected customer card.
- After adding a participant, clear search and selection.
- If no customer found, allow quick registration with:
  - First name(s)
  - Paternal last name
  - Maternal last name
  - Phone or email (at least one required)
- On save: create customer, auto-select, and add to tournament.

## Winner Assignment UX
- During tournament setup, configure winnerCount (1..8).
- On close, UI must require selecting exactly winnerCount participants.
- Winner selection is by position (1..N) and uses prizeDistribution.
- If prize is store credit: credit amount is taken from each position amount.
- If product/mixed: mark winners as prize recipients and store notes (amount may be 0).

## Routing and Tabs
- Tournament list route: `/tournaments`.
- Tournament detail route: `/tournaments/[id]`.
- For static export builds, the detail view may use a stable route (e.g., `/tournaments/detail`)
  with `?id=` as the real tournament id to avoid build-time params.
- Clicking "Create Tournament" or a tournament row navigates to detail.
- Detail uses tabs:
  - Details
  - Participants
  - Entry sales
  - Winners

## Tournament List Filters
- Filters for date range, game, and participant count (min/max or exact).
- Results update quickly and do not block the UI.
 - Pagination and sorting are handled via IPC queries.
 - Default list ordering shows latest tournaments first.

## Delete Rules
- Allow deleting only if:
  - No winners recorded.
  - No entry sales exist for the tournament.
- When blocked, show inline error and keep the tournament intact.

## Future Extensions
- Pairings
- Round results
- Online registration
