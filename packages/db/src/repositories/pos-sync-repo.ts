import type { DbHandle } from "../db";

export type CatalogManifestEntry = {
  entityType: string;
  cloudId: string;
  localId: string | null;
  updatedAt: string | null;
  versionHash: string | null;
};

export type SyncJournalEvent = {
  id: string;
  terminalId: string | null;
  branchId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  status: "PENDING" | "SYNCED" | "FAILED";
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  lastErrorCode: string | null;
  manualInterventionRequired: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
};

export type PosSyncState = {
  catalogSnapshotVersion: string | null;
  snapshotAppliedAt: string | null;
  lastDeltaSyncAt: string | null;
  lastReconcileAt: string | null;
  lastSyncErrorCode: string | null;
};

function parsePayload(payload: string): Record<string, unknown> {
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function createPosSyncRepository(db: DbHandle) {
  const ensureStateStmt = db.prepare(`
    INSERT INTO pos_sync_state (id)
    VALUES (1)
    ON CONFLICT(id) DO NOTHING
  `);

  const upsertStateStmt = db.prepare(`
    UPDATE pos_sync_state
    SET
      catalog_snapshot_version = COALESCE(@catalogSnapshotVersion, catalog_snapshot_version),
      snapshot_applied_at = COALESCE(@snapshotAppliedAt, snapshot_applied_at),
      last_delta_sync_at = COALESCE(@lastDeltaSyncAt, last_delta_sync_at),
      last_reconcile_at = COALESCE(@lastReconcileAt, last_reconcile_at),
      last_sync_error_code = @lastSyncErrorCode
    WHERE id = 1
  `);

  const insertJournalStmt = db.prepare(`
    INSERT INTO sync_journal (
      id,
      terminal_id,
      branch_id,
      event_type,
      payload,
      status,
      retry_count,
      max_retries,
      next_retry_at,
      last_error_code,
      manual_intervention_required,
      created_at,
      updated_at,
      synced_at
    ) VALUES (
      @id,
      @terminalId,
      @branchId,
      @eventType,
      @payload,
      @status,
      @retryCount,
      @maxRetries,
      @nextRetryAt,
      @lastErrorCode,
      @manualInterventionRequired,
      @createdAt,
      @updatedAt,
      @syncedAt
    )
  `);

  ensureStateStmt.run();

  return {
    getState(): PosSyncState {
      ensureStateStmt.run();
      const row = db
        .prepare(
          "SELECT catalog_snapshot_version, snapshot_applied_at, last_delta_sync_at, last_reconcile_at, last_sync_error_code FROM pos_sync_state WHERE id = 1"
        )
        .get() as
        | {
            catalog_snapshot_version: string | null;
            snapshot_applied_at: string | null;
            last_delta_sync_at: string | null;
            last_reconcile_at: string | null;
            last_sync_error_code: string | null;
          }
        | undefined;

      return {
        catalogSnapshotVersion: row?.catalog_snapshot_version ?? null,
        snapshotAppliedAt: row?.snapshot_applied_at ?? null,
        lastDeltaSyncAt: row?.last_delta_sync_at ?? null,
        lastReconcileAt: row?.last_reconcile_at ?? null,
        lastSyncErrorCode: row?.last_sync_error_code ?? null
      };
    },

    updateState(next: Partial<PosSyncState>) {
      ensureStateStmt.run();
      upsertStateStmt.run({
        catalogSnapshotVersion: next.catalogSnapshotVersion ?? null,
        snapshotAppliedAt: next.snapshotAppliedAt ?? null,
        lastDeltaSyncAt: next.lastDeltaSyncAt ?? null,
        lastReconcileAt: next.lastReconcileAt ?? null,
        lastSyncErrorCode: next.lastSyncErrorCode ?? null
      });
    },

    replaceCatalog(items: Array<{ entityType: string; cloudId: string; updatedAt: string; versionHash: string; payload: Record<string, unknown> }>) {
      const tx = db.transaction((rows: typeof items) => {
        db.prepare("DELETE FROM catalog_meta").run();
        for (const row of rows) {
          db.prepare(
            `INSERT INTO catalog_meta (entity_type, cloud_id, version_hash, updated_at, payload)
             VALUES (?, ?, ?, ?, ?)`
          ).run(row.entityType, row.cloudId, row.versionHash, row.updatedAt, JSON.stringify(row.payload));
        }
      });
      tx(items);
    },

    upsertCatalogItems(items: Array<{ entityType: string; cloudId: string; updatedAt: string; versionHash: string; payload: Record<string, unknown> }>) {
      const upsert = db.prepare(
        `INSERT INTO catalog_meta (entity_type, cloud_id, version_hash, updated_at, payload)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(entity_type, cloud_id)
         DO UPDATE SET
           version_hash = excluded.version_hash,
           updated_at = excluded.updated_at,
           payload = excluded.payload`
      );
      const tx = db.transaction((rows: typeof items) => {
        for (const row of rows) {
          upsert.run(row.entityType, row.cloudId, row.versionHash, row.updatedAt, JSON.stringify(row.payload));
        }
      });
      tx(items);
    },

    listCatalogManifest(limit = 5000): CatalogManifestEntry[] {
      const rows = db
        .prepare(
          `SELECT
             cm.entity_type AS entity_type,
             cm.cloud_id AS cloud_id,
             map.local_id AS local_id,
             cm.updated_at AS updated_at,
             cm.version_hash AS version_hash
           FROM catalog_meta cm
           LEFT JOIN catalog_id_map map
             ON map.entity_type = cm.entity_type AND map.cloud_id = cm.cloud_id
           ORDER BY cm.updated_at DESC
           LIMIT ?`
        )
        .all(limit) as Array<{
        entity_type: string;
        cloud_id: string;
        local_id: string | null;
        updated_at: string | null;
        version_hash: string | null;
      }>;

      return rows.map((row) => ({
        entityType: row.entity_type,
        cloudId: row.cloud_id,
        localId: row.local_id,
        updatedAt: row.updated_at,
        versionHash: row.version_hash
      }));
    },

    upsertIdMappings(rows: Array<{ entityType: string; cloudId: string; localId: string | null }>) {
      const upsert = db.prepare(
        `INSERT INTO catalog_id_map (entity_type, cloud_id, local_id)
         VALUES (?, ?, ?)
         ON CONFLICT(entity_type, cloud_id)
         DO UPDATE SET local_id = excluded.local_id`
      );
      const tx = db.transaction((items: typeof rows) => {
        for (const row of items) {
          upsert.run(row.entityType, row.cloudId, row.localId);
        }
      });
      tx(rows);
    },

    enqueueSyncEvent(event: {
      id: string;
      terminalId: string | null;
      branchId: string | null;
      eventType: string;
      payload: Record<string, unknown>;
      maxRetries?: number;
      nextRetryAt?: string | null;
      nowIso: string;
    }) {
      insertJournalStmt.run({
        id: event.id,
        terminalId: event.terminalId,
        branchId: event.branchId,
        eventType: event.eventType,
        payload: JSON.stringify(event.payload),
        status: "PENDING",
        retryCount: 0,
        maxRetries: event.maxRetries ?? 10,
        nextRetryAt: event.nextRetryAt ?? null,
        lastErrorCode: null,
        manualInterventionRequired: 0,
        createdAt: event.nowIso,
        updatedAt: event.nowIso,
        syncedAt: null
      });
    },

    listPendingEvents(limit = 100): SyncJournalEvent[] {
      const rows = db
        .prepare(
          `SELECT *
           FROM sync_journal
           WHERE status = 'PENDING'
             AND manual_intervention_required = 0
             AND (next_retry_at IS NULL OR next_retry_at <= ?)
           ORDER BY created_at ASC
           LIMIT ?`
        )
        .all(new Date().toISOString(), limit) as Array<{
        id: string;
        terminal_id: string | null;
        branch_id: string | null;
        event_type: string;
        payload: string;
        status: "PENDING" | "SYNCED" | "FAILED";
        retry_count: number;
        max_retries: number;
        next_retry_at: string | null;
        last_error_code: string | null;
        manual_intervention_required: number;
        created_at: string;
        updated_at: string;
        synced_at: string | null;
      }>;

      return rows.map((row) => ({
        id: row.id,
        terminalId: row.terminal_id,
        branchId: row.branch_id,
        eventType: row.event_type,
        payload: parsePayload(row.payload),
        status: row.status,
        retryCount: row.retry_count,
        maxRetries: row.max_retries,
        nextRetryAt: row.next_retry_at,
        lastErrorCode: row.last_error_code,
        manualInterventionRequired: row.manual_intervention_required === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        syncedAt: row.synced_at
      }));
    },

    markEventSynced(id: string, nowIso: string) {
      db.prepare(
        `UPDATE sync_journal
         SET status = 'SYNCED', synced_at = ?, updated_at = ?, last_error_code = NULL
         WHERE id = ?`
      ).run(nowIso, nowIso, id);
    },

    markEventRetry(id: string, params: { retryCount: number; nextRetryAt: string; errorCode: string | null; nowIso: string; manualInterventionRequired: boolean }) {
      db.prepare(
        `UPDATE sync_journal
         SET retry_count = ?,
             next_retry_at = ?,
             last_error_code = ?,
             manual_intervention_required = ?,
             status = CASE WHEN ? = 1 THEN 'FAILED' ELSE 'PENDING' END,
             updated_at = ?
         WHERE id = ?`
      ).run(
        params.retryCount,
        params.nextRetryAt,
        params.errorCode,
        params.manualInterventionRequired ? 1 : 0,
        params.manualInterventionRequired ? 1 : 0,
        params.nowIso,
        id
      );
    },

    getJournalStats() {
      const pending = db
        .prepare("SELECT COUNT(*) as count FROM sync_journal WHERE status = 'PENDING' AND manual_intervention_required = 0")
        .get() as { count: number };
      const oldest = db
        .prepare(
          "SELECT created_at as createdAt FROM sync_journal WHERE status = 'PENDING' AND manual_intervention_required = 0 ORDER BY created_at ASC LIMIT 1"
        )
        .get() as { createdAt: string } | undefined;

      return {
        queuedEvents: pending?.count ?? 0,
        oldestPendingAt: oldest?.createdAt ?? null
      };
    }
  };
}
