# Tournaments (Tournaments) - Tasks

## Phase 1 - Domain
- Models: Tournament, Participant, Prize.
- Capacity and state validations.
- Winner count validation.
- Duplicate participant guard.
- Helpers for registering participants and closing tournament.

## Phase 2 - Persistence
- SQLite schema and repositories.
- Queries by date/status.
- Paginated list query with filters and sorting.
- Links with sales and credit.
- Add prize distribution per position.
- Add delete guard (block when winners or entry sales exist).

## Phase 3 - IPC
- Endpoints for:
  - Tournament CRUD
  - Register participants
  - Close tournament and assign winners
  - Sales integration
- Tournament list pagination, filters, and sorting
- Delete with guard rules

## Phase 4 - UI
- Tournament list and detail.
- Route split: /tournaments and /tournaments/[id].
- Tabs in tournament detail (Details, Participants, Entry sales, Winners).
- Shadcn DataTable for tournament list with pagination and filters.
- Participant registration flow with search + selected card.
- Quick customer registration modal for missing participants.
- Entry sale from POS.
- Winner assignment with multi-select and exact count validation.
- Prize distribution by position UI.
- List filters (date, game, participant count).

## Phase 5 - Sales Integration
- Link entry sale to tournament.
- Reflect in cash register and daily reports.

## Phase 6 - Credit Integration
- Generate credit movements for prizes.
- Show in customer credit history.

## Phase 7 - UX and Validation
- Empty and loading states.
- Inline errors.
- Basic accessibility.
- Clear disabled states.
- Delete guard messaging.
