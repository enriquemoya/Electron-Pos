import type { DbHandle } from "../db";
import type { Tournament } from "@pos/core";

type TournamentRow = {
  id: string;
  name: string;
  game: string;
  game_type_id: string | null;
  expansion_id: string | null;
  date: string;
  max_capacity: number;
  entry_price_amount: number;
  entry_price_currency: "MXN";
  prize_type: Tournament["prizeType"];
  prize_value_amount: number;
  prize_value_currency: "MXN";
  winner_count: number;
  prize_distribution: string | null;
  status: Tournament["status"];
  created_at: string;
  updated_at: string;
};

type TournamentPagedRow = TournamentRow & {
  participant_count: number | null;
};

function defaultDistribution(totalAmount: number, winnerCount: number): number[] {
  if (winnerCount <= 0) {
    return [];
  }
  const base = Math.floor(totalAmount / winnerCount);
  const remainder = totalAmount % winnerCount;
  return Array.from({ length: winnerCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

function parseDistribution(row: TournamentRow): number[] {
  if (row.prize_distribution) {
    try {
      const parsed = JSON.parse(row.prize_distribution);
      if (Array.isArray(parsed) && parsed.every((value) => Number.isFinite(value))) {
        return parsed.map((value) => Math.max(0, Math.trunc(value)));
      }
    } catch {
      // Ignore invalid JSON and fall back to default distribution.
    }
  }
  return defaultDistribution(row.prize_value_amount, row.winner_count);
}

function mapRow(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    game: row.game,
    gameTypeId: row.game_type_id ?? null,
    expansionId: row.expansion_id ?? null,
    date: row.date,
    maxCapacity: row.max_capacity,
    entryPrice: { amount: row.entry_price_amount, currency: row.entry_price_currency },
    prizeType: row.prize_type,
    prizeValue: { amount: row.prize_value_amount, currency: row.prize_value_currency },
    winnerCount: row.winner_count,
    prizeDistribution: parseDistribution(row),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createTournamentRepository(db: DbHandle) {
  const insertStmt = db.prepare(`
    INSERT INTO tournaments (
      id,
      name,
      game,
      game_type_id,
      expansion_id,
      date,
      max_capacity,
      entry_price_amount,
      entry_price_currency,
      prize_type,
      prize_value_amount,
      prize_value_currency,
      winner_count,
      prize_distribution,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE tournaments SET
      name = ?,
      game = ?,
      game_type_id = ?,
      expansion_id = ?,
      date = ?,
      max_capacity = ?,
      entry_price_amount = ?,
      entry_price_currency = ?,
      prize_type = ?,
      prize_value_amount = ?,
      prize_value_currency = ?,
      winner_count = ?,
      prize_distribution = ?,
      status = ?,
      updated_at = ?
    WHERE id = ?
  `);

  return {
    create(tournament: Tournament): Tournament {
      insertStmt.run(
        tournament.id,
        tournament.name,
        tournament.game,
        tournament.gameTypeId ?? null,
        tournament.expansionId ?? null,
        tournament.date,
        tournament.maxCapacity,
        tournament.entryPrice.amount,
        tournament.entryPrice.currency,
        tournament.prizeType,
        tournament.prizeValue.amount,
        tournament.prizeValue.currency,
        tournament.winnerCount,
        JSON.stringify(tournament.prizeDistribution ?? []),
        tournament.status,
        tournament.createdAt,
        tournament.updatedAt
      );
      return tournament;
    },
    update(tournament: Tournament): Tournament {
      updateStmt.run(
        tournament.name,
        tournament.game,
        tournament.gameTypeId ?? null,
        tournament.expansionId ?? null,
        tournament.date,
        tournament.maxCapacity,
        tournament.entryPrice.amount,
        tournament.entryPrice.currency,
        tournament.prizeType,
        tournament.prizeValue.amount,
        tournament.prizeValue.currency,
        tournament.winnerCount,
        JSON.stringify(tournament.prizeDistribution ?? []),
        tournament.status,
        tournament.updatedAt,
        tournament.id
      );
      return tournament;
    },
    getById(id: string): Tournament | null {
      const row = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(id) as
        | TournamentRow
        | undefined;
      return row ? mapRow(row) : null;
    },
    list(): Tournament[] {
      const rows = db
        .prepare("SELECT * FROM tournaments ORDER BY date DESC, created_at DESC")
        .all() as TournamentRow[];
      return rows.map(mapRow);
    },
    listFiltered(filters: {
      from?: string;
      to?: string;
      game?: string;
      gameTypeId?: string;
      minParticipants?: number;
      maxParticipants?: number;
    }): Tournament[] {
      const conditions: string[] = [];
      const values: (string | number)[] = [];

      if (filters.from) {
        conditions.push("t.date >= ?");
        values.push(filters.from);
      }
      if (filters.to) {
        conditions.push("t.date <= ?");
        values.push(filters.to);
      }
      if (filters.game) {
        conditions.push("t.game = ?");
        values.push(filters.game);
      }
      if (filters.gameTypeId) {
        conditions.push("t.game_type_id = ?");
        values.push(filters.gameTypeId);
      }
      if (Number.isFinite(filters.minParticipants)) {
        conditions.push("COALESCE(p.participant_count, 0) >= ?");
        values.push(filters.minParticipants as number);
      }
      if (Number.isFinite(filters.maxParticipants)) {
        conditions.push("COALESCE(p.participant_count, 0) <= ?");
        values.push(filters.maxParticipants as number);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const rows = db
        .prepare(
          `
          SELECT t.*
          FROM tournaments t
          LEFT JOIN (
            SELECT tournament_id, COUNT(*) as participant_count
            FROM tournament_participants
            GROUP BY tournament_id
          ) p ON p.tournament_id = t.id
          ${whereClause}
          ORDER BY t.date DESC, t.created_at DESC
          `
        )
        .all(...values) as TournamentRow[];

      return rows.map(mapRow);
    },
    listPaged(filters: {
      from?: string;
      to?: string;
      gameTypeId?: string;
      minParticipants?: number;
      maxParticipants?: number;
      sortBy?: "DATE" | "GAME" | "PARTICIPANTS";
      sortDir?: "ASC" | "DESC";
      page?: number;
      pageSize?: number;
    }): { items: { tournament: Tournament; participantCount: number }; total: number; page: number; pageSize: number } {
      const conditions: string[] = [];
      const values: (string | number)[] = [];

      if (filters.from) {
        conditions.push("t.date >= ?");
        values.push(filters.from);
      }
      if (filters.to) {
        conditions.push("t.date <= ?");
        values.push(filters.to);
      }
      if (filters.gameTypeId) {
        conditions.push("t.game_type_id = ?");
        values.push(filters.gameTypeId);
      }
      if (Number.isFinite(filters.minParticipants)) {
        conditions.push("COALESCE(p.participant_count, 0) >= ?");
        values.push(filters.minParticipants as number);
      }
      if (Number.isFinite(filters.maxParticipants)) {
        conditions.push("COALESCE(p.participant_count, 0) <= ?");
        values.push(filters.maxParticipants as number);
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

      const sortBy = filters.sortBy ?? "DATE";
      const sortDir = filters.sortDir === "ASC" ? "ASC" : "DESC";
      const sortColumn =
        sortBy === "GAME"
          ? "t.game"
          : sortBy === "PARTICIPANTS"
            ? "COALESCE(p.participant_count, 0)"
            : "t.date";

      const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 20));
      const page = Math.max(1, filters.page ?? 1);
      const offset = (page - 1) * pageSize;

      const totalRow = db
        .prepare(
          `
          SELECT COUNT(*) as total
          FROM tournaments t
          LEFT JOIN (
            SELECT tournament_id, COUNT(*) as participant_count
            FROM tournament_participants
            GROUP BY tournament_id
          ) p ON p.tournament_id = t.id
          ${whereClause}
          `
        )
        .get(...values) as { total: number };

      const rows = db
        .prepare(
          `
          SELECT t.*, COALESCE(p.participant_count, 0) as participant_count
          FROM tournaments t
          LEFT JOIN (
            SELECT tournament_id, COUNT(*) as participant_count
            FROM tournament_participants
            GROUP BY tournament_id
          ) p ON p.tournament_id = t.id
          ${whereClause}
          ORDER BY ${sortColumn} ${sortDir}, t.created_at DESC
          LIMIT ? OFFSET ?
          `
        )
        .all(...values, pageSize, offset) as TournamentPagedRow[];

      const items = rows.map((row) => ({
        tournament: mapRow(row),
        participantCount: row.participant_count ?? 0
      }));

      return { items, total: totalRow?.total ?? 0, page, pageSize };
    },
    close(id: string, updatedAt: string): Tournament {
      const row = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(id) as
        | TournamentRow
        | undefined;
      if (!row) {
        throw new Error("Tournament not found.");
      }
      const updated: Tournament = {
        ...mapRow(row),
        status: "CLOSED",
        updatedAt
      };
      updateStmt.run(
        updated.name,
        updated.game,
        updated.gameTypeId ?? null,
        updated.expansionId ?? null,
        updated.date,
        updated.maxCapacity,
        updated.entryPrice.amount,
        updated.entryPrice.currency,
        updated.prizeType,
        updated.prizeValue.amount,
        updated.prizeValue.currency,
        updated.winnerCount,
        JSON.stringify(updated.prizeDistribution ?? []),
        updated.status,
        updated.updatedAt,
        updated.id
      );
      return updated;
    },
    remove(id: string) {
      db.prepare("DELETE FROM tournaments WHERE id = ?").run(id);
    }
  };
}
