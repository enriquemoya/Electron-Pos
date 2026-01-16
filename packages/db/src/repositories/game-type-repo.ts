import type { DbHandle } from "../db";
import type { GameType } from "@pos/core";

type GameTypeRow = {
  id: string;
  name: string;
  active: number;
  created_at: string;
  updated_at: string;
};

function mapRow(row: GameTypeRow): GameType {
  return {
    id: row.id,
    name: row.name,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createGameTypeRepository(db: DbHandle) {
  const insertStmt = db.prepare(`
    INSERT INTO game_types (id, name, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE game_types
    SET name = ?, active = ?, updated_at = ?
    WHERE id = ?
  `);

  return {
    list(activeOnly = false): GameType[] {
      const where = activeOnly ? "WHERE active = 1" : "";
      const rows = db
        .prepare(`SELECT * FROM game_types ${where} ORDER BY name ASC`)
        .all() as GameTypeRow[];
      return rows.map(mapRow);
    },
    getById(id: string): GameType | null {
      const row = db.prepare("SELECT * FROM game_types WHERE id = ?").get(id) as
        | GameTypeRow
        | undefined;
      return row ? mapRow(row) : null;
    },
    create(payload: { id: string; name: string; active: boolean; createdAt: string; updatedAt: string }): GameType {
      insertStmt.run(
        payload.id,
        payload.name,
        payload.active ? 1 : 0,
        payload.createdAt,
        payload.updatedAt
      );
      return {
        id: payload.id,
        name: payload.name,
        active: payload.active,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt
      };
    },
    update(payload: { id: string; name: string; active: boolean; updatedAt: string }): GameType {
      updateStmt.run(payload.name, payload.active ? 1 : 0, payload.updatedAt, payload.id);
      const row = db.prepare("SELECT * FROM game_types WHERE id = ?").get(payload.id) as
        | GameTypeRow
        | undefined;
      if (!row) {
        throw new Error("Game type not found.");
      }
      return mapRow(row);
    }
  };
}
