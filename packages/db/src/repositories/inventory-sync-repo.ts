import type { DbHandle } from "../db";

export type InventorySyncState = {
  posId: string;
  lastSyncAt: string | null;
  lastAttemptAt: string | null;
  lastResult: string | null;
  pendingCount: number | null;
};

export function createInventorySyncRepository(db: DbHandle) {
  const upsertStmt = db.prepare(`
    INSERT INTO inventory_sync_state (
      pos_id,
      last_sync_at,
      last_attempt_at,
      last_result,
      pending_count
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(pos_id) DO UPDATE SET
      last_sync_at = excluded.last_sync_at,
      last_attempt_at = excluded.last_attempt_at,
      last_result = excluded.last_result,
      pending_count = excluded.pending_count
  `);

  return {
    getState(posId: string): InventorySyncState {
      const row = db.prepare("SELECT * FROM inventory_sync_state WHERE pos_id = ?").get(posId) as
        | {
            pos_id: string;
            last_sync_at: string | null;
            last_attempt_at: string | null;
            last_result: string | null;
            pending_count: number | null;
          }
        | undefined;
      return {
        posId,
        lastSyncAt: row?.last_sync_at ?? null,
        lastAttemptAt: row?.last_attempt_at ?? null,
        lastResult: row?.last_result ?? null,
        pendingCount: row?.pending_count ?? null
      };
    },
    setState(state: InventorySyncState) {
      upsertStmt.run(
        state.posId,
        state.lastSyncAt,
        state.lastAttemptAt,
        state.lastResult,
        state.pendingCount
      );
      return state;
    }
  };
}
