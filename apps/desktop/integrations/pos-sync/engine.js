const crypto = require("crypto");

const RETRIABLE_CODES = new Set([
  "POS_SYNC_STORAGE_FAILED",
  "POS_SYNC_RATE_LIMITED",
  "SERVER_ERROR"
]);

function nowIso() {
  return new Date().toISOString();
}

function toIsoAfter(ms) {
  return new Date(Date.now() + ms).toISOString();
}

function backoffMs(retryCount) {
  const base = Math.min(60_000, 1000 * Math.pow(2, Math.max(0, retryCount - 1)));
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

async function fetchPaged(fetchPage, pageSize = 200) {
  const items = [];
  let page = 1;
  let total = 0;
  let snapshotVersion = null;
  do {
    const response = await fetchPage({ page, pageSize });
    const chunk = Array.isArray(response.items) ? response.items : [];
    total = Number(response.total || chunk.length);
    snapshotVersion = response.snapshotVersion || snapshotVersion;
    items.push(...chunk);
    if (items.length >= total || chunk.length === 0) {
      break;
    }
    page += 1;
  } while (true);

  return {
    items,
    total,
    snapshotVersion: snapshotVersion || null
  };
}

async function applySnapshot({ cloudClient, posSyncRepo }) {
  const snapshot = await fetchPaged(
    ({ page, pageSize }) => cloudClient.fetchCatalogSnapshot({ page, pageSize }),
    200
  );

  const mapped = snapshot.items.map((item) => ({
    entityType: String(item.entityType || "PRODUCT"),
    cloudId: String(item.cloudId || ""),
    updatedAt: String(item.updatedAt || nowIso()),
    versionHash: String(item.versionHash || crypto.createHash("sha256").update(JSON.stringify(item.payload || {})).digest("hex")),
    payload: (item.payload && typeof item.payload === "object") ? item.payload : {}
  })).filter((item) => item.cloudId);

  posSyncRepo.replaceCatalog(mapped);
  posSyncRepo.upsertIdMappings(mapped.map((entry) => ({
    entityType: entry.entityType,
    cloudId: entry.cloudId,
    localId: entry.cloudId
  })));

  posSyncRepo.updateState({
    catalogSnapshotVersion: snapshot.snapshotVersion,
    snapshotAppliedAt: nowIso(),
    lastDeltaSyncAt: nowIso(),
    lastSyncErrorCode: null
  });

  return {
    mode: "snapshot",
    itemCount: mapped.length,
    snapshotVersion: snapshot.snapshotVersion
  };
}

async function applyDelta({ cloudClient, posSyncRepo, since }) {
  const delta = await fetchPaged(
    ({ page, pageSize }) => cloudClient.fetchCatalogDelta({ since, page, pageSize }),
    200
  );

  const mapped = delta.items.map((item) => ({
    entityType: String(item.entityType || "PRODUCT"),
    cloudId: String(item.cloudId || ""),
    updatedAt: String(item.updatedAt || nowIso()),
    versionHash: String(item.versionHash || crypto.createHash("sha256").update(JSON.stringify(item.payload || {})).digest("hex")),
    payload: (item.payload && typeof item.payload === "object") ? item.payload : {}
  })).filter((item) => item.cloudId);

  if (mapped.length > 0) {
    posSyncRepo.upsertCatalogItems(mapped);
    posSyncRepo.upsertIdMappings(mapped.map((entry) => ({
      entityType: entry.entityType,
      cloudId: entry.cloudId,
      localId: entry.cloudId
    })));
  }

  posSyncRepo.updateState({
    catalogSnapshotVersion: delta.snapshotVersion,
    lastDeltaSyncAt: nowIso(),
    lastSyncErrorCode: null
  });

  return {
    mode: "delta",
    itemCount: mapped.length,
    snapshotVersion: delta.snapshotVersion
  };
}

async function runCatalogSync({ cloudClient, posSyncRepo }) {
  const state = posSyncRepo.getState();
  if (!state.catalogSnapshotVersion || !state.snapshotAppliedAt) {
    return applySnapshot({ cloudClient, posSyncRepo });
  }
  return applyDelta({
    cloudClient,
    posSyncRepo,
    since: state.lastDeltaSyncAt || state.snapshotAppliedAt
  });
}

function normalizeErrorCode(error) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  if (error instanceof Error) {
    return error.message || "POS_SYNC_STORAGE_FAILED";
  }
  return "POS_SYNC_STORAGE_FAILED";
}

async function flushSalesJournal({ cloudClient, posSyncRepo }) {
  const pending = posSyncRepo.listPendingEvents(100);
  let synced = 0;
  for (const event of pending) {
    try {
      const response = await cloudClient.sendSalesEvent({
        localEventId: event.id,
        eventType: event.eventType,
        payload: event.payload
      });
      if (response?.status === "duplicate" || response?.status === "synced") {
        posSyncRepo.markEventSynced(event.id, nowIso());
        synced += 1;
        continue;
      }
      posSyncRepo.markEventSynced(event.id, nowIso());
      synced += 1;
    } catch (error) {
      const errorCode = normalizeErrorCode(error);
      const retryCount = event.retryCount + 1;
      const exhausted = retryCount >= event.maxRetries;
      const shouldRetry = RETRIABLE_CODES.has(errorCode) || errorCode.startsWith("POS_") || errorCode === "fetch failed";
      const manualInterventionRequired = exhausted || !shouldRetry;
      posSyncRepo.markEventRetry(event.id, {
        retryCount,
        nextRetryAt: toIsoAfter(backoffMs(retryCount)),
        errorCode,
        nowIso: nowIso(),
        manualInterventionRequired
      });
    }
  }

  return {
    attempted: pending.length,
    synced,
    remaining: Math.max(0, pending.length - synced)
  };
}

async function runReconcile({ cloudClient, posSyncRepo }) {
  const manifest = posSyncRepo.listCatalogManifest(5000);
  const plan = await cloudClient.reconcileCatalog({ catalogManifest: manifest });
  const missing = Array.isArray(plan.missing) ? plan.missing : [];

  if (missing.length > 0) {
    const delta = await fetchPaged(
      ({ page, pageSize }) => cloudClient.fetchCatalogDelta({ since: null, page, pageSize }),
      200
    );
    const map = new Map(
      delta.items
        .filter((item) => item && item.cloudId)
        .map((item) => [String(item.cloudId), item])
    );
    const toApply = missing
      .map((entry) => map.get(String(entry.cloudId || "")))
      .filter(Boolean)
      .map((item) => ({
        entityType: String(item.entityType || "PRODUCT"),
        cloudId: String(item.cloudId || ""),
        updatedAt: String(item.updatedAt || nowIso()),
        versionHash: String(item.versionHash || ""),
        payload: item.payload && typeof item.payload === "object" ? item.payload : {}
      }));

    if (toApply.length > 0) {
      posSyncRepo.upsertCatalogItems(toApply);
      posSyncRepo.upsertIdMappings(toApply.map((entry) => ({
        entityType: entry.entityType,
        cloudId: entry.cloudId,
        localId: entry.cloudId
      })));
    }
  }

  posSyncRepo.updateState({
    catalogSnapshotVersion: typeof plan.snapshotVersion === "string" ? plan.snapshotVersion : null,
    lastReconcileAt: nowIso(),
    lastSyncErrorCode: null
  });

  return {
    missing: missing.length,
    stale: Array.isArray(plan.stale) ? plan.stale.length : 0,
    unknown: Array.isArray(plan.unknown) ? plan.unknown.length : 0,
    snapshotVersion: plan.snapshotVersion || null
  };
}

function enqueueSaleSyncEvent({ posSyncRepo, terminalState, sale }) {
  const now = nowIso();
  const eventId = crypto.randomUUID();
  posSyncRepo.enqueueSyncEvent({
    id: eventId,
    terminalId: terminalState?.terminalId || null,
    branchId: terminalState?.branchId || null,
    eventType: "SALE_COMMITTED",
    payload: {
      localEventId: eventId,
      saleId: sale.id,
      sale,
      committedAt: now
    },
    nowIso: now,
    maxRetries: 10
  });
  return eventId;
}

module.exports = {
  runCatalogSync,
  runReconcile,
  flushSalesJournal,
  enqueueSaleSyncEvent
};
