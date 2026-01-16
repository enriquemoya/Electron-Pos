import type { DbHandle } from "../db";
import type { SyncState } from "@pos/core";

type SyncStateRow = {
  provider: string;
  status: string;
  last_synced_at: string | null;
  metadata: string | null;
};

function mapRow(row: SyncStateRow): SyncState {
  const metadata = row.metadata ? JSON.parse(row.metadata) : {};
  return {
    status: row.status as SyncState["status"],
    lastSyncAt: row.last_synced_at ?? undefined,
    driveFileId: metadata.driveFileId,
    lastUploadAt: metadata.lastUploadAt,
    lastDownloadAt: metadata.lastDownloadAt,
    lastRemoteModifiedTime: metadata.lastRemoteModifiedTime,
    conflictCount: metadata.conflictCount,
    error: metadata.error
  };
}

export function createSyncStateRepository(db: DbHandle) {
  const upsert = db.prepare(`
    INSERT INTO sync_state (provider, status, last_synced_at, metadata)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(provider) DO UPDATE SET
      status = excluded.status,
      last_synced_at = excluded.last_synced_at,
      metadata = excluded.metadata
  `);

  return {
    get(provider: string): SyncState | null {
      const row = db.prepare("SELECT * FROM sync_state WHERE provider = ?").get(provider) as
        | SyncStateRow
        | undefined;
      return row ? mapRow(row) : null;
    },
    set(provider: string, state: SyncState) {
      const metadata = {
        driveFileId: state.driveFileId,
        lastUploadAt: state.lastUploadAt,
        lastDownloadAt: state.lastDownloadAt,
        lastRemoteModifiedTime: state.lastRemoteModifiedTime,
        conflictCount: state.conflictCount,
        error: state.error
      };
      upsert.run(provider, state.status, state.lastSyncAt ?? null, JSON.stringify(metadata));
    },
    clear(provider: string) {
      db.prepare("DELETE FROM sync_state WHERE provider = ?").run(provider);
    }
  };
}
