const crypto = require("crypto");
const { deriveProofStatus } = require("@pos/core");

const RETRIABLE_CODES = new Set([
  "POS_SYNC_STORAGE_FAILED",
  "POS_SYNC_RATE_LIMITED",
  "SERVER_ERROR",
  "INVENTORY_STOCK_WRITE_FAILED",
  "INVENTORY_STOCK_READ_FAILED"
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
    if (chunk.length === 0 || page * pageSize >= total) {
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

async function applySnapshot({ cloudClient, posSyncRepo, catalogProjectionService }) {
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

  const projectionResult = catalogProjectionService.projectSnapshot({
    items: mapped,
    remoteVersion: snapshot.snapshotVersion,
    nowIso: nowIso()
  });

  posSyncRepo.updateState({
    catalogSnapshotVersion: projectionResult.nextVersion,
    snapshotAppliedAt: nowIso(),
    lastDeltaSyncAt: nowIso(),
    lastSyncErrorCode: null
  });

  return {
    mode: "snapshot",
    itemCount: projectionResult.appliedCount,
    snapshotVersion: projectionResult.nextVersion,
    projection: projectionResult.stats
  };
}

async function applyDelta({ cloudClient, posSyncRepo, since, catalogProjectionService }) {
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

  const projectionResult = catalogProjectionService.projectDelta({
    items: mapped,
    remoteVersion: delta.snapshotVersion,
    nowIso: nowIso()
  });

  posSyncRepo.updateState({
    catalogSnapshotVersion: projectionResult.nextVersion,
    lastDeltaSyncAt: nowIso(),
    lastSyncErrorCode: null
  });

  return {
    mode: "delta",
    itemCount: projectionResult.appliedCount,
    snapshotVersion: projectionResult.nextVersion,
    projection: projectionResult.stats
  };
}

async function runCatalogSync({ cloudClient, posSyncRepo, catalogProjectionService }) {
  const state = posSyncRepo.getState();
  if (!state.catalogSnapshotVersion || !state.snapshotAppliedAt) {
    return applySnapshot({ cloudClient, posSyncRepo, catalogProjectionService });
  }
  return applyDelta({
    cloudClient,
    posSyncRepo,
    since: state.lastDeltaSyncAt || state.snapshotAppliedAt,
    catalogProjectionService
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
  const pending = posSyncRepo.listPendingEvents(100).filter((event) => event.eventType === "SALE_COMMITTED");
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

async function flushProofUploadJournal({ cloudClient, posSyncRepo, saleRepo }) {
  const pending = posSyncRepo.listPendingEvents(100).filter((event) => event.eventType === "PROOF_UPLOAD");
  let synced = 0;
  for (const event of pending) {
    try {
      const payload = event.payload || {};
      const localPath = String(payload.localPath || "");
      const fileName = String(payload.fileName || "proof.bin");
      const mimeType = String(payload.mimeType || "application/octet-stream");
      const saleId = payload.saleId ? String(payload.saleId) : null;
      if (!localPath) {
        posSyncRepo.markEventRetry(event.id, {
          retryCount: event.retryCount + 1,
          nextRetryAt: toIsoAfter(backoffMs(event.retryCount + 1)),
          errorCode: "PROOF_UPLOAD_FAILED",
          nowIso: nowIso(),
          manualInterventionRequired: true
        });
        continue;
      }
      const fs = require("fs");
      if (!fs.existsSync(localPath)) {
        posSyncRepo.markEventRetry(event.id, {
          retryCount: event.retryCount + 1,
          nextRetryAt: toIsoAfter(backoffMs(event.retryCount + 1)),
          errorCode: "PROOF_UPLOAD_FAILED",
          nowIso: nowIso(),
          manualInterventionRequired: true
        });
        continue;
      }
      const response = await cloudClient.uploadProof({
        fileBuffer: fs.readFileSync(localPath),
        fileName,
        mimeType,
        saleId
      });
      if (saleId && saleRepo) {
        saleRepo.updateProof(saleId, response.url, deriveProofStatus(String(payload.method || "TRANSFERENCIA"), true));
      }
      fs.unlinkSync(localPath);
      posSyncRepo.markEventSynced(event.id, nowIso());
      synced += 1;
    } catch (error) {
      const errorCode = normalizeErrorCode(error);
      const retryCount = event.retryCount + 1;
      posSyncRepo.markEventRetry(event.id, {
        retryCount,
        nextRetryAt: toIsoAfter(Math.max(30 * 60_000, backoffMs(retryCount))),
        errorCode,
        nowIso: nowIso(),
        manualInterventionRequired: retryCount >= event.maxRetries
      });
    }
  }
  return {
    attempted: pending.length,
    synced,
    remaining: Math.max(0, pending.length - synced)
  };
}

async function flushInventoryAdjustmentJournal({
  cloudClient,
  posSyncRepo,
  inventoryRepo,
  terminalAuthService
}) {
  const pending = posSyncRepo
    .listPendingEvents(100)
    .filter((event) => event.eventType === "INVENTORY_MANUAL_ADJUST");
  let synced = 0;

  for (const event of pending) {
    try {
      const payload = event.payload || {};
      const endpoint = String(payload.endpoint || "TERMINAL");
      const productId = String(payload.productId || "");
      const delta = Number(payload.delta || 0);
      const reason = String(payload.reason || "");
      const idempotencyKey = String(payload.idempotencyKey || event.id);
      if (!productId || !Number.isInteger(delta) || delta === 0 || !reason) {
        posSyncRepo.markEventRetry(event.id, {
          retryCount: event.retryCount + 1,
          nextRetryAt: toIsoAfter(backoffMs(event.retryCount + 1)),
          errorCode: "INVENTORY_INVALID",
          nowIso: nowIso(),
          manualInterventionRequired: true
        });
        continue;
      }

      let response;
      if (endpoint === "ADMIN") {
        const session = terminalAuthService?.getUserSessionState?.();
        const posUserToken = terminalAuthService?.getUserAccessToken?.();
        if (!session?.authenticated || session.user?.role !== "ADMIN" || !posUserToken) {
          posSyncRepo.markEventRetry(event.id, {
            retryCount: event.retryCount + 1,
            nextRetryAt: toIsoAfter(Math.max(30 * 60_000, backoffMs(event.retryCount + 1))),
            errorCode: "AUTH_SESSION_EXPIRED",
            nowIso: nowIso(),
            manualInterventionRequired: false
          });
          continue;
        }
        response = await cloudClient.sendAdminInventoryMovement({
          productId,
          delta,
          reason,
          idempotencyKey,
          posUserToken: posUserToken
        });
      } else {
        response = await cloudClient.sendInventoryMovement({
          productId,
          delta,
          reason,
          idempotencyKey
        });
      }

      const nextQuantity =
        typeof response?.item?.available === "number"
          ? response.item.available
          : Number(response?.adjustment?.newQuantity ?? NaN);
      if (Number.isFinite(nextQuantity) && inventoryRepo) {
        inventoryRepo.setStock(productId, Math.max(0, Math.trunc(nextQuantity)), nowIso());
      }
      posSyncRepo.markEventSynced(event.id, nowIso());
      synced += 1;
    } catch (error) {
      const errorCode = normalizeErrorCode(error);
      const retryCount = event.retryCount + 1;
      const shouldRetry = RETRIABLE_CODES.has(errorCode) || errorCode.startsWith("POS_") || errorCode === "fetch failed";
      const manualInterventionRequired = retryCount >= event.maxRetries || !shouldRetry;
      posSyncRepo.markEventRetry(event.id, {
        retryCount,
        nextRetryAt: toIsoAfter(Math.max(30 * 60_000, backoffMs(retryCount))),
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

async function runReconcile({ cloudClient, posSyncRepo, catalogProjectionService }) {
  const manifest = posSyncRepo.listCatalogManifest(5000);
  const plan = await cloudClient.reconcileCatalog({ catalogManifest: manifest });
  const missing = Array.isArray(plan.missing) ? plan.missing : [];
  let resolvedSnapshotVersion = posSyncRepo.getState().catalogSnapshotVersion ?? null;

  if (missing.length > 0) {
    const delta = await fetchPaged(
      ({ page, pageSize }) => cloudClient.fetchCatalogDelta({ since: null, page, pageSize }),
      200
    );
    const map = new Map(
      delta.items
        .filter((item) => item && item.cloudId)
        .map((item) => [`${String(item.entityType || "PRODUCT").toUpperCase()}:${String(item.cloudId)}`, item])
    );
    const toApply = missing
      .map((entry) => map.get(`${String(entry.entityType || "PRODUCT").toUpperCase()}:${String(entry.cloudId || "")}`))
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
      const projectionResult = catalogProjectionService.projectDelta({
        items: toApply,
        remoteVersion: plan.snapshotVersion || null,
        nowIso: nowIso()
      });
      resolvedSnapshotVersion = projectionResult.nextVersion;
    }
  }

  if (resolvedSnapshotVersion == null) {
    const projectionResult = catalogProjectionService.projectDelta({
      items: [],
      remoteVersion: plan.snapshotVersion || null,
      nowIso: nowIso()
    });
    resolvedSnapshotVersion = projectionResult.nextVersion;
  }

  posSyncRepo.updateState({
    catalogSnapshotVersion: resolvedSnapshotVersion,
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
  flushInventoryAdjustmentJournal,
  flushProofUploadJournal,
  enqueueSaleSyncEvent
};
