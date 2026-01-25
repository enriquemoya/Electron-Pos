import type { DbHandle } from "../db";

export function createAppliedEventRepository(db: DbHandle) {
  const insertStmt = db.prepare(`
    INSERT INTO applied_events (event_id, source, applied_at)
    VALUES (?, ?, ?)
  `);

  return {
    isApplied(eventId: string) {
      const row = db.prepare("SELECT event_id FROM applied_events WHERE event_id = ?").get(eventId) as
        | { event_id: string }
        | undefined;
      return Boolean(row?.event_id);
    },
    markApplied(eventId: string, source: string, appliedAt: string) {
      insertStmt.run(eventId, source, appliedAt);
    }
  };
}
