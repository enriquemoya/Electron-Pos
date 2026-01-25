# Expansions (Expansiones por Juego) - Design

## Data models

### GameType (existing)
- id
- name
- active

### Expansion
- id
- gameTypeId (FK -> game_types.id)
- name
- code (optional)
- releaseDate (optional)
- active
- createdAt
- updatedAt

### Product (existing, extended behavior)
- gameTypeId (optional)
- expansionId (optional)

### Tournament (existing, extended behavior)
- gameTypeId (optional)
- expansionId (optional)

## Relationships & validation
- Expansion belongs to exactly one Game Type.
- Expansion name is unique per gameTypeId.
- Product/Tournament can select expansion only if gameTypeId is selected.
- If expansionId is set, it must belong to the selected gameTypeId.

## UI flows

### Manage expansions
- Location: Settings > Catálogos > Juegos y Expansiones.
- List expansions by selected game type.
- Actions: create, edit, deactivate.

### Use in product creation/edit
- Cascading selects:
  - Game Type (optional)
  - Expansion (enabled only when Game Type selected)
- Expansion list filtered to selected game type and active expansions.

### Use in tournaments
- Same cascading behavior as products.
- Expansion remains optional.

## Cascading select logic
- If no game type selected: expansion select is disabled and cleared.
- If game type changes: reset expansion selection.
- If expansion is inactive: show for historical records only, not selectable in new forms.

## Responsibilities
- Domain: validation helpers (if needed) for game/expansion consistency.
- DB: enforce FK and uniqueness per game type, store active flag.
- IPC: expose CRUD for expansions and filtered lists by game type.
- UI: render cascading selects, block invalid selections, show inline errors.

## Error handling
- Duplicate expansion name per game type returns a clear error.
- Attempting to assign expansion without game shows inline error.
- Attempting to select expansion from another game shows inline error.

## Expansion creation validation
- Creating an Expansion requires selecting a Game Type; the form must block Save when gameTypeId is missing.
- Inline error example (i18n-ready): "Selecciona un juego para continuar."

## Persistence strategy
- SQLite tables: expansions with FK to game_types.
- Soft-deactivate via active flag; do not delete referenced expansions.
- DB/IPC enforce delete rules:
  - Delete allowed only if not referenced.
  - If referenced, delete is blocked with: "No se puede eliminar una expansión en uso. Desactívala en su lugar."

## Future extensions
- Collections/sets within expansions.
- Import helpers for expansion catalogs.
