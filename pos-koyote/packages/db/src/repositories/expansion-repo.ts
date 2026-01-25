import type { DbHandle } from "../db";
import type { Expansion } from "@pos/core";

type ExpansionRow = {
  id: string;
  game_type_id: string;
  name: string;
  code: string | null;
  release_date: string | null;
  active: number;
  created_at: string;
  updated_at: string;
};

function mapRow(row: ExpansionRow): Expansion {
  return {
    id: row.id,
    gameTypeId: row.game_type_id,
    name: row.name,
    code: row.code ?? null,
    releaseDate: row.release_date ?? null,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createExpansionRepository(db: DbHandle) {
  const insertStmt = db.prepare(`
    INSERT INTO expansions (
      id,
      game_type_id,
      name,
      code,
      release_date,
      active,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE expansions SET
      game_type_id = ?,
      name = ?,
      code = ?,
      release_date = ?,
      active = ?,
      updated_at = ?
    WHERE id = ?
  `);

  const referenceCountStmt = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM products WHERE expansion_id = ?) as product_count,
      (SELECT COUNT(*) FROM tournaments WHERE expansion_id = ?) as tournament_count
  `);

  const hasDuplicateName = (id: string | null, gameTypeId: string, name: string) => {
    const row = db
      .prepare(
        `
        SELECT id FROM expansions
        WHERE game_type_id = ?
          AND LOWER(name) = LOWER(?)
          ${id ? "AND id <> ?" : ""}
        LIMIT 1
        `
      )
      .get(...(id ? [gameTypeId, name, id] : [gameTypeId, name])) as
      | { id: string }
      | undefined;
    return Boolean(row);
  };

  return {
    getById(id: string): Expansion | null {
      const row = db.prepare("SELECT * FROM expansions WHERE id = ?").get(id) as
        | ExpansionRow
        | undefined;
      return row ? mapRow(row) : null;
    },
    listByGameType(gameTypeId: string, includeInactive = false): Expansion[] {
      const rows = db
        .prepare(
          `
          SELECT * FROM expansions
          WHERE game_type_id = ?
          ${includeInactive ? "" : "AND active = 1"}
          ORDER BY name ASC
          `
        )
        .all(gameTypeId) as ExpansionRow[];
      return rows.map(mapRow);
    },
    create(payload: Expansion): Expansion {
      if (!payload.gameTypeId) {
        throw new Error("Game type required.");
      }
      if (hasDuplicateName(null, payload.gameTypeId, payload.name)) {
        throw new Error("Expansion name already exists.");
      }
      insertStmt.run(
        payload.id,
        payload.gameTypeId,
        payload.name,
        payload.code ?? null,
        payload.releaseDate ?? null,
        payload.active ? 1 : 0,
        payload.createdAt,
        payload.updatedAt
      );
      return payload;
    },
    update(payload: Expansion): Expansion {
      if (!payload.gameTypeId) {
        throw new Error("Game type required.");
      }
      if (hasDuplicateName(payload.id, payload.gameTypeId, payload.name)) {
        throw new Error("Expansion name already exists.");
      }
      updateStmt.run(
        payload.gameTypeId,
        payload.name,
        payload.code ?? null,
        payload.releaseDate ?? null,
        payload.active ? 1 : 0,
        payload.updatedAt,
        payload.id
      );
      return payload;
    },
    deactivate(expansionId: string): Expansion {
      const existing = db.prepare("SELECT * FROM expansions WHERE id = ?").get(expansionId) as
        | ExpansionRow
        | undefined;
      if (!existing) {
        throw new Error("Expansion not found.");
      }
      const updatedAt = new Date().toISOString();
      updateStmt.run(
        existing.game_type_id,
        existing.name,
        existing.code ?? null,
        existing.release_date ?? null,
        0,
        updatedAt,
        existing.id
      );
      return {
        ...mapRow(existing),
        active: false,
        updatedAt
      };
    },
    delete(expansionId: string) {
      const refCounts = referenceCountStmt.get(expansionId, expansionId) as
        | { product_count: number; tournament_count: number }
        | undefined;
      const productCount = refCounts?.product_count ?? 0;
      const tournamentCount = refCounts?.tournament_count ?? 0;
      if (productCount > 0 || tournamentCount > 0) {
        throw new Error("Expansion is referenced.");
      }
      db.prepare("DELETE FROM expansions WHERE id = ?").run(expansionId);
    }
  };
}
