import type { DbHandle } from "../db";

type CatalogEntity = {
  entityType: string;
  cloudId: string;
  updatedAt: string;
  versionHash: string;
  payload: Record<string, unknown>;
};

type ProjectionStats = {
  inserted: number;
  updated: number;
  disabled: number;
  deleted: number;
};

function normalizeCategory(value: unknown) {
  const raw = String(value || "").toUpperCase();
  const allowed = new Set(["TCG_SEALED", "TCG_SINGLE", "ACCESSORY", "COMMODITY", "SERVICE"]);
  return allowed.has(raw) ? raw : "COMMODITY";
}

function asIso(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return fallback;
}

function asInt(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.trunc(parsed));
}

function asMoneyAmount(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.round(parsed));
}

function asFlag(value: unknown, fallback = 1) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (typeof value === "number") {
    return value > 0 ? 1 : 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return 1;
    }
    if (normalized === "false" || normalized === "0") {
      return 0;
    }
  }
  return fallback;
}

function buildProjectionError(message: string) {
  const error = new Error(message) as Error & { code?: string };
  error.code = "POS_CATALOG_PROJECTION_FAILED";
  return error;
}

export function createCatalogProjectionRepository(db: DbHandle) {
  const upsertProductStmt = db.prepare(`
    INSERT INTO products (
      id,
      cloud_id,
      name,
      category,
      price_amount,
      price_currency,
      game_type_id,
      expansion_id,
      game,
      expansion,
      rarity,
      condition,
      image_url,
      is_stock_tracked,
      enabled_pos,
      enabled_online_store,
      cloud_updated_at,
      is_deleted_cloud,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, 'MXN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      cloud_id = excluded.cloud_id,
      name = excluded.name,
      category = excluded.category,
      price_amount = excluded.price_amount,
      game_type_id = excluded.game_type_id,
      expansion_id = excluded.expansion_id,
      game = excluded.game,
      expansion = excluded.expansion,
      rarity = excluded.rarity,
      condition = excluded.condition,
      image_url = excluded.image_url,
      is_stock_tracked = excluded.is_stock_tracked,
      enabled_pos = excluded.enabled_pos,
      enabled_online_store = excluded.enabled_online_store,
      cloud_updated_at = excluded.cloud_updated_at,
      is_deleted_cloud = excluded.is_deleted_cloud,
      updated_at = excluded.updated_at
  `);

  const upsertInventoryStmt = db.prepare(`
    INSERT INTO inventory (product_id, stock, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(product_id) DO UPDATE SET
      stock = excluded.stock,
      updated_at = excluded.updated_at
  `);

  const upsertGameTypeStmt = db.prepare(`
    INSERT INTO game_types (
      id,
      cloud_id,
      name,
      active,
      enabled_pos,
      enabled_online_store,
      cloud_updated_at,
      is_deleted_cloud,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      cloud_id = excluded.cloud_id,
      name = excluded.name,
      active = excluded.active,
      enabled_pos = excluded.enabled_pos,
      enabled_online_store = excluded.enabled_online_store,
      cloud_updated_at = excluded.cloud_updated_at,
      is_deleted_cloud = excluded.is_deleted_cloud,
      updated_at = excluded.updated_at
  `);

  const upsertExpansionStmt = db.prepare(`
    INSERT INTO expansions (
      id,
      cloud_id,
      game_type_id,
      name,
      code,
      release_date,
      active,
      enabled_pos,
      enabled_online_store,
      cloud_updated_at,
      is_deleted_cloud,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      cloud_id = excluded.cloud_id,
      game_type_id = excluded.game_type_id,
      name = excluded.name,
      code = excluded.code,
      release_date = excluded.release_date,
      active = excluded.active,
      enabled_pos = excluded.enabled_pos,
      enabled_online_store = excluded.enabled_online_store,
      cloud_updated_at = excluded.cloud_updated_at,
      is_deleted_cloud = excluded.is_deleted_cloud,
      updated_at = excluded.updated_at
  `);

  const disableAllProductsStmt = db.prepare(`
    UPDATE products
    SET enabled_pos = 0, is_deleted_cloud = 1
    WHERE cloud_id IS NOT NULL
  `);
  const disableAllGameTypesStmt = db.prepare(`
    UPDATE game_types
    SET enabled_pos = 0, is_deleted_cloud = 1
    WHERE cloud_id IS NOT NULL
  `);
  const disableAllExpansionsStmt = db.prepare(`
    UPDATE expansions
    SET enabled_pos = 0, is_deleted_cloud = 1
    WHERE cloud_id IS NOT NULL
  `);

  const countVisibleStmt = db.prepare(
    "SELECT COUNT(*) AS count FROM products WHERE enabled_pos = 1 AND is_deleted_cloud = 0"
  );

  const applyOne = (item: CatalogEntity, stats: ProjectionStats, now: string) => {
    const payload = (item.payload && typeof item.payload === "object") ? item.payload : {};
    const cloudUpdatedAt = asIso(item.updatedAt, now);
    const enabledPOS = asFlag(payload.enabledPOS, 1);
    const enabledOnlineStore = asFlag(payload.enabledOnlineStore, 1);
    const isDeleted = asFlag(payload.isDeletedCloud, 0);

    const productId = String(payload.id || item.cloudId || "");
    if (!productId) {
      throw buildProjectionError("product id missing");
    }

    const gameTypeId = payload.gameId ? String(payload.gameId) : null;
    const expansionId = payload.expansionId ? String(payload.expansionId) : null;
    const createdAt = asIso(payload.createdAt, cloudUpdatedAt);

    const resolvedGameTypeId = gameTypeId || (expansionId ? expansionId : null);
    const resolvedGameTypeName = payload.game ? String(payload.game) : "Unknown";

    if (resolvedGameTypeId) {
      upsertGameTypeStmt.run(
        resolvedGameTypeId,
        resolvedGameTypeId,
        resolvedGameTypeName,
        enabledPOS,
        enabledPOS,
        enabledOnlineStore,
        cloudUpdatedAt,
        isDeleted,
        createdAt,
        now
      );
    }

    if (expansionId && resolvedGameTypeId) {
      upsertExpansionStmt.run(
        expansionId,
        expansionId,
        resolvedGameTypeId,
        String(payload.expansion || payload.name || "Expansion"),
        null,
        null,
        enabledPOS,
        enabledPOS,
        enabledOnlineStore,
        cloudUpdatedAt,
        isDeleted,
        createdAt,
        now
      );
    }

    upsertProductStmt.run(
      productId,
      item.cloudId,
      String(payload.name || "Unnamed product"),
      normalizeCategory(payload.category),
      asMoneyAmount(payload.price, 0),
      resolvedGameTypeId,
      expansionId,
      payload.game ? String(payload.game) : null,
      payload.expansion ? String(payload.expansion) : null,
      payload.rarity ? String(payload.rarity) : null,
      payload.condition ? String(payload.condition) : null,
      payload.imageUrl ? String(payload.imageUrl) : null,
      1,
      enabledPOS,
      enabledOnlineStore,
      cloudUpdatedAt,
      isDeleted,
      createdAt,
      now
    );

    upsertInventoryStmt.run(productId, asInt(payload.available, 0), cloudUpdatedAt);

    const exists = db
      .prepare("SELECT 1 FROM catalog_id_map WHERE entity_type = ? AND cloud_id = ? LIMIT 1")
      .get(item.entityType, item.cloudId) as { 1: number } | undefined;
    if (exists) {
      stats.updated += 1;
    } else {
      stats.inserted += 1;
    }
  };

  const upsertMapStmt = db.prepare(
    `INSERT INTO catalog_id_map (entity_type, cloud_id, local_id)
     VALUES (?, ?, ?)
     ON CONFLICT(entity_type, cloud_id)
     DO UPDATE SET local_id = excluded.local_id`
  );

  const projectSnapshotTx = db.transaction((items: CatalogEntity[], now: string) => {
    const stats: ProjectionStats = { inserted: 0, updated: 0, disabled: 0, deleted: 0 };
    disableAllProductsStmt.run();
    disableAllGameTypesStmt.run();
    disableAllExpansionsStmt.run();

    for (const item of items) {
      applyOne(item, stats, now);
      upsertMapStmt.run(item.entityType, item.cloudId, item.cloudId);
    }

    const visibleCount = (countVisibleStmt.get() as { count: number } | undefined)?.count ?? 0;
    stats.disabled = Math.max(0, items.length - visibleCount);
    stats.deleted = 0;
    return stats;
  });

  const projectDeltaTx = db.transaction((items: CatalogEntity[], now: string) => {
    const stats: ProjectionStats = { inserted: 0, updated: 0, disabled: 0, deleted: 0 };

    for (const item of items) {
      const payload = (item.payload && typeof item.payload === "object") ? item.payload : {};
      const deletedBefore = db
        .prepare("SELECT is_deleted_cloud FROM products WHERE id = ?")
        .get(String(payload.id || item.cloudId || "")) as { is_deleted_cloud: number } | undefined;

      applyOne(item, stats, now);
      upsertMapStmt.run(item.entityType, item.cloudId, item.cloudId);

      const isDeleted = asFlag(payload.isDeletedCloud, 0) === 1;
      if (isDeleted) {
        stats.deleted += 1;
      } else if ((deletedBefore?.is_deleted_cloud ?? 0) === 1) {
        stats.disabled += 1;
      }
    }

    return stats;
  });

  return {
    projectSnapshot(items: CatalogEntity[], nowIso: string) {
      return projectSnapshotTx(items, nowIso);
    },
    projectDelta(items: CatalogEntity[], nowIso: string) {
      return projectDeltaTx(items, nowIso);
    }
  };
}
