const EPOCH_VERSION = "1970-01-01T00:00:00.000Z";

function buildError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isValidIso(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function sanitizeEntity(raw) {
  const payload = raw && typeof raw.payload === "object" ? raw.payload : {};
  const entityType = String(raw?.entityType || "PRODUCT").toUpperCase();
  return {
    entityType,
    cloudId: String(raw?.cloudId || payload.id || ""),
    updatedAt: String(raw?.updatedAt || new Date().toISOString()),
    versionHash: String(raw?.versionHash || ""),
    payload
  };
}

function sanitizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map(sanitizeEntity).filter((item) => {
    if (!item.cloudId) {
      return false;
    }
    if (!["PRODUCT", "GAME", "EXPANSION", "CATEGORY"].includes(item.entityType)) {
      throw buildError("SYNC_ENTITYTYPE_UNSUPPORTED", `Unsupported entityType ${item.entityType}`);
    }
    return true;
  });
}

function resolveNextVersion({ currentVersion, remoteVersion }) {
  if (!remoteVersion || typeof remoteVersion !== "string") {
    return currentVersion;
  }

  if (remoteVersion === EPOCH_VERSION) {
    return currentVersion;
  }

  if (!isValidIso(remoteVersion)) {
    throw buildError("SYNC_VERSION_REGRESSION", "Invalid snapshot version payload");
  }

  if (!currentVersion || !isValidIso(currentVersion)) {
    return remoteVersion;
  }

  if (Date.parse(remoteVersion) < Date.parse(currentVersion)) {
    throw buildError("SYNC_VERSION_REGRESSION", "Snapshot version regression rejected");
  }

  return remoteVersion;
}

function createCatalogProjectionService({ posSyncRepo, projectionRepo }) {
  function projectSnapshot({ items, remoteVersion, nowIso }) {
    try {
      const normalized = sanitizeItems(items);
      const stats = projectionRepo.projectSnapshot(normalized, nowIso);
      const currentState = posSyncRepo.getState();
      const nextVersion = resolveNextVersion({
        currentVersion: currentState.catalogSnapshotVersion,
        remoteVersion
      });

      return {
        stats,
        nextVersion,
        appliedCount: normalized.length
      };
    } catch (error) {
      const projectionError = buildError(
        error?.code || "POS_CATALOG_PROJECTION_FAILED",
        error instanceof Error ? error.message : "Catalog projection failed"
      );
      throw projectionError;
    }
  }

  function projectDelta({ items, remoteVersion, nowIso }) {
    try {
      const normalized = sanitizeItems(items);
      const stats = projectionRepo.projectDelta(normalized, nowIso);
      const currentState = posSyncRepo.getState();
      const nextVersion = resolveNextVersion({
        currentVersion: currentState.catalogSnapshotVersion,
        remoteVersion
      });

      return {
        stats,
        nextVersion,
        appliedCount: normalized.length
      };
    } catch (error) {
      const projectionError = buildError(
        error?.code || "POS_CATALOG_PROJECTION_FAILED",
        error instanceof Error ? error.message : "Catalog projection failed"
      );
      throw projectionError;
    }
  }

  return {
    projectSnapshot,
    projectDelta
  };
}

module.exports = {
  createCatalogProjectionService,
  resolveNextVersion,
  EPOCH_VERSION
};
