import type { DbHandle } from "../db";
import type { TournamentParticipant } from "@pos/core";

type ParticipantRow = {
  id: string;
  tournament_id: string;
  display_name: string;
  customer_id: string | null;
  registered_at: string;
};

function mapRow(row: ParticipantRow): TournamentParticipant {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    name: row.display_name,
    customerId: row.customer_id,
    createdAt: row.registered_at
  };
}

export function createParticipantRepository(db: DbHandle) {
  const insertStmt = db.prepare(`
    INSERT INTO tournament_participants (
      id,
      tournament_id,
      display_name,
      customer_id,
      registered_at
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const deleteStmt = db.prepare(
    "DELETE FROM tournament_participants WHERE id = ? AND tournament_id = ?"
  );
  const deleteAllStmt = db.prepare(
    "DELETE FROM tournament_participants WHERE tournament_id = ?"
  );

  const listStmt = db.prepare(
    "SELECT * FROM tournament_participants WHERE tournament_id = ? ORDER BY registered_at ASC"
  );

  const countStmt = db.prepare(
    "SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = ?"
  );

  return {
    add(participant: TournamentParticipant): TournamentParticipant {
      insertStmt.run(
        participant.id,
        participant.tournamentId,
        participant.name,
        participant.customerId ?? null,
        participant.createdAt
      );
      return participant;
    },
    listByTournament(tournamentId: string): TournamentParticipant[] {
      const rows = listStmt.all(tournamentId) as ParticipantRow[];
      return rows.map(mapRow);
    },
    countByTournament(tournamentId: string): number {
      const row = countStmt.get(tournamentId) as { count: number } | undefined;
      return row?.count ?? 0;
    },
    remove(tournamentId: string, participantId: string) {
      deleteStmt.run(participantId, tournamentId);
    },
    removeAllByTournament(tournamentId: string) {
      deleteAllStmt.run(tournamentId);
    }
  };
}
