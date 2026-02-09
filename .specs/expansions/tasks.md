# Expansions (Expansiones por Juego) - Tasks

## Phase 1: Domain (if needed)
- Add validation helpers for:
  - Expansion must belong to selected game type.
  - Expansion cannot exist without game type.

## Phase 2: DB
- Add `expansions` table with FK to `game_types`.
- Add unique constraint on (game_type_id, name).
- Add indexes for game_type_id and active.
- Add optional `expansion_id` to products and tournaments (FK).
- Add safe migrations for existing DBs.
- Add delete rules:
  - Allow delete only if expansion is not referenced.
  - Block delete if referenced and surface a clear error.

## Phase 3: IPC
- Add expansion CRUD:
  - listByGameType(gameTypeId, includeInactive?)
  - createExpansion
  - updateExpansion
  - deactivateExpansion
  - deleteExpansion (only if not referenced)
- Add validation errors for duplicate names or invalid relations.

## Phase 4: UI
- Add catalog screen for expansions in Settings > Catálogos > Juegos y Expansiones.
- Add cascading selects in product create/edit.
- Add cascading selects in tournament create/edit.
- Ensure inactive expansions are visible for history but not selectable for new records.
- When referenced, show "Desactivar" instead of "Eliminar" with inline error on blocked delete.

## Phase 5: Integration
- Update reports filters to include game type and expansion.
- Ensure product and tournament filters respect expansion selection rules.

## Phase 6: Validation & UX polish
- Inline errors for invalid selections.
- Clear disabled states for expansion select.
- Loading and empty states.
