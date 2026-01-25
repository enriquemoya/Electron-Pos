import type { DbHandle } from "../db";
import type { TournamentPrize } from "@pos/core";

type PrizeRow = {
  id: string;
  tournament_id: string;
  participant_id: string;
  position: number;
  prize_type: TournamentPrize["prizeType"];
  credit_amount: number | null;
  product_notes: string | null;
  created_at: string;
};

function mapRow(row: PrizeRow): TournamentPrize {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    participantId: row.participant_id,
    position: row.position,
    prizeType: row.prize_type,
    creditAmount: row.credit_amount === null ? null : { amount: row.credit_amount, currency: "MXN" },
    productNotes: row.product_notes,
    createdAt: row.created_at
  };
}

export function createTournamentPrizeRepository(db: DbHandle) {
  const insertStmt = db.prepare(`
    INSERT INTO tournament_prizes (
      id,
      tournament_id,
      participant_id,
      position,
      prize_type,
      credit_amount,
      product_notes,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const listStmt = db.prepare(
    "SELECT * FROM tournament_prizes WHERE tournament_id = ? ORDER BY position ASC, created_at ASC"
  );

  return {
    add(prize: TournamentPrize): TournamentPrize {
      insertStmt.run(
      prize.id,
      prize.tournamentId,
      prize.participantId,
      prize.position,
      prize.prizeType,
      prize.creditAmount ? prize.creditAmount.amount : null,
      prize.productNotes ?? null,
      prize.createdAt
    );
      return prize;
    },
    listByTournament(tournamentId: string): TournamentPrize[] {
      const rows = listStmt.all(tournamentId) as PrizeRow[];
      return rows.map(mapRow);
    }
  };
}
