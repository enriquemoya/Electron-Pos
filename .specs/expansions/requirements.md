# Expansions (Expansiones por Juego) - Requirements

## Goal
- Provide a managed catalog of expansions per game type and enable optional selection in products and tournaments.

## Users
- Store owner
- Store staff

## Language & i18n
- UI text must be Spanish (MX) and dictionary-based.
- Example labels: "Expansiones", "Selecciona un juego", "Selecciona una expansión".

## Core capabilities
- Create, edit, and deactivate expansions.
- Link each expansion to exactly one game type.
- Select expansions in Products and Tournaments (optional).
- Use game + expansion as filters in reports.

## Relationship rules (Game-Expansion-Product)
- Game Type is an independent catalog entity.
- Expansion always belongs to exactly one Game Type.
- Expansion name is unique per Game Type.
- Product gameTypeId is optional.
- Product expansionId is optional.
- Product may have no game and no expansion, or game only, or game + expansion.
- Product must not have an expansion without a game.
- Product must not reference an expansion from a different game.

## Catalog rules
- Expansions cannot exist without a game type.
- Expansions can always be deactivated.
- Delete is allowed only when the expansion is not referenced.
- If referenced, deletion is blocked with a clear error:
  - "No se puede eliminar una expansión en uso. Desactívala en su lugar."
- Inactive expansions:
  - Are not selectable for new products or tournaments.
  - Remain visible for historical records.

## Constraints
- Local-first with SQLite as source of truth.
- Renderer must access data only via IPC.
- No external APIs.

## Out of scope
- Set collections or card-level metadata.
- Automatic import from third-party APIs.

## Performance expectations
- Expansion lists load quickly and are filtered by game type.
- Catalog operations remain responsive for hundreds of expansions.
