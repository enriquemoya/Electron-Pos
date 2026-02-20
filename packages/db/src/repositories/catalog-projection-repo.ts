import type { DbHandle } from "../db";

type CatalogEntityType = "PRODUCT" | "GAME" | "EXPANSION" | "CATEGORY";

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
  skipped: number;
};

type ProjectionError = Error & { code?: string };

function buildProjectionError(code: string, message: string): ProjectionError {
  const error = new Error(message) as ProjectionError;
  error.code = code;
  return error;
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

function normalizeEntityType(value: string): CatalogEntityType {
  const normalized = String(value || "").trim().toUpperCase();
  if (
    normalized === "PRODUCT" ||
    normalized === "GAME" ||
    normalized === "EXPANSION" ||
    normalized === "CATEGORY"
  ) {
    return normalized;
  }
  throw buildProjectionError("SYNC_ENTITYTYPE_UNSUPPORTED", `Unsupported entity type: ${value}`);
}

function normalizeDeletion(payload: Record<string, unknown>) {
  const deletedByFlag = asFlag(payload.isDeletedCloud, 0) === 1;
  const deletedByDate = typeof payload.deletedAt === "string" && payload.deletedAt.trim().length > 0;
  return deletedByFlag || deletedByDate;
}

function requireName(payload: Record<string, unknown>, code: string) {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name) {
    throw buildProjectionError(code, "Taxonomy name is required.");
  }
  return name;
}

export function createCatalogProjectionRepository(db: DbHandle) {
  const upsertMapStmt = db.prepare(
    `INSERT INTO catalog_id_map (entity_type, cloud_id, local_id)
     VALUES (?, ?, ?)
     ON CONFLICT(entity_type, cloud_id)
     DO UPDATE SET local_id = excluded.local_id`
  );

  const existsMapStmt = db.prepare(
    "SELECT 1 AS found FROM catalog_id_map WHERE entity_type = ? AND cloud_id = ? LIMIT 1"
  );

  const categoryByCloudStmt = db.prepare(
    "SELECT id, name FROM categories WHERE cloud_id = ? LIMIT 1"
  );
  const gameByCloudStmt = db.prepare(
    "SELECT id, name FROM game_types WHERE cloud_id = ? LIMIT 1"
  );
  const expansionByCloudStmt = db.prepare(
    "SELECT id, name FROM expansions WHERE cloud_id = ? LIMIT 1"
  );

  const upsertCategoryStmt = db.prepare(`
    INSERT INTO categories (
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

  const upsertProductStmt = db.prepare(`
    INSERT INTO products (
      id,
      cloud_id,
      name,
      category,
      category_cloud_id,
      game_cloud_id,
      expansion_cloud_id,
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'MXN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      cloud_id = excluded.cloud_id,
      name = excluded.name,
      category = excluded.category,
      category_cloud_id = excluded.category_cloud_id,
      game_cloud_id = excluded.game_cloud_id,
      expansion_cloud_id = excluded.expansion_cloud_id,
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

  function softDisableMissing(table: "products" | "game_types" | "expansions" | "categories", incomingCloudIds: Set<string>) {
    if (incomingCloudIds.size === 0) {
      const result = db
        .prepare(`UPDATE ${table} SET enabled_pos = 0 WHERE cloud_id IS NOT NULL`)
        .run();
      return result.changes;
    }
    const placeholders = [...incomingCloudIds].map(() => "?").join(",");
    const result = db
      .prepare(
        `UPDATE ${table}
         SET enabled_pos = 0
         WHERE cloud_id IS NOT NULL
           AND cloud_id NOT IN (${placeholders})`
      )
      .run(...incomingCloudIds);
    return result.changes;
  }

  const applyCategory = (item: CatalogEntity, nowIso: string) => {
    const payload = item.payload ?? {};
    const cloudUpdatedAt = asIso(item.updatedAt, nowIso);
    const enabledPOS = asFlag(payload.enabledPOS, 1);
    const enabledOnlineStore = asFlag(payload.enabledOnlineStore, 1);
    const isDeleted = normalizeDeletion(payload);
    const localId = String(payload.id || item.cloudId);
    const name = requireName(payload, "TAXONOMY_MISSING_REQUIRED_FIELD");
    const active = asFlag(payload.active, enabledPOS);
    const createdAt = asIso(payload.createdAt, cloudUpdatedAt);

    upsertCategoryStmt.run(
      localId,
      item.cloudId,
      name,
      active,
      isDeleted ? 0 : enabledPOS,
      enabledOnlineStore,
      cloudUpdatedAt,
      isDeleted ? 1 : 0,
      createdAt,
      nowIso
    );

    upsertMapStmt.run("CATEGORY", item.cloudId, localId);
    return localId;
  };

  const applyGame = (item: CatalogEntity, nowIso: string) => {
    const payload = item.payload ?? {};
    const cloudUpdatedAt = asIso(item.updatedAt, nowIso);
    const enabledPOS = asFlag(payload.enabledPOS, 1);
    const enabledOnlineStore = asFlag(payload.enabledOnlineStore, 1);
    const isDeleted = normalizeDeletion(payload);
    const localId = String(payload.id || item.cloudId);
    const name = requireName(payload, "TAXONOMY_MISSING_REQUIRED_FIELD");
    const active = asFlag(payload.active, enabledPOS);
    const createdAt = asIso(payload.createdAt, cloudUpdatedAt);

    upsertGameTypeStmt.run(
      localId,
      item.cloudId,
      name,
      active,
      isDeleted ? 0 : enabledPOS,
      enabledOnlineStore,
      cloudUpdatedAt,
      isDeleted ? 1 : 0,
      createdAt,
      nowIso
    );

    upsertMapStmt.run("GAME", item.cloudId, localId);
    return localId;
  };

  const applyExpansion = (item: CatalogEntity, nowIso: string) => {
    const payload = item.payload ?? {};
    const cloudUpdatedAt = asIso(item.updatedAt, nowIso);
    const enabledPOS = asFlag(payload.enabledPOS, 1);
    const enabledOnlineStore = asFlag(payload.enabledOnlineStore, 1);
    const isDeleted = normalizeDeletion(payload);
    const localId = String(payload.id || item.cloudId);
    const name = requireName(payload, "TAXONOMY_MISSING_REQUIRED_FIELD");
    const gameCloudId = payload.gameCloudId
      ? String(payload.gameCloudId)
      : payload.gameId
        ? String(payload.gameId)
        : payload.parentId
          ? String(payload.parentId)
          : null;

    if (!gameCloudId) {
      throw buildProjectionError("TAXONOMY_MISSING_REQUIRED_FIELD", "Expansion game reference missing.");
    }

    const gameRow = gameByCloudStmt.get(gameCloudId) as { id: string } | undefined;
    if (!gameRow) {
      throw buildProjectionError(
        "TAXONOMY_REFERENCE_NOT_FOUND",
        `Expansion references missing game taxonomy ${gameCloudId}.`
      );
    }

    const createdAt = asIso(payload.createdAt, cloudUpdatedAt);
    const active = asFlag(payload.active, enabledPOS);

    upsertExpansionStmt.run(
      localId,
      item.cloudId,
      gameRow.id,
      name,
      typeof payload.code === "string" ? payload.code : null,
      typeof payload.releaseDate === "string" ? payload.releaseDate : null,
      active,
      isDeleted ? 0 : enabledPOS,
      enabledOnlineStore,
      cloudUpdatedAt,
      isDeleted ? 1 : 0,
      createdAt,
      nowIso
    );

    upsertMapStmt.run("EXPANSION", item.cloudId, localId);
    return localId;
  };

  const applyProduct = (item: CatalogEntity, nowIso: string) => {
    const payload = item.payload ?? {};
    const cloudUpdatedAt = asIso(item.updatedAt, nowIso);
    const enabledPOS = asFlag(payload.enabledPOS, 1);
    const enabledOnlineStore = asFlag(payload.enabledOnlineStore, 1);
    const isDeleted = normalizeDeletion(payload);

    const localId = String(payload.id || item.cloudId || "");
    if (!localId) {
      throw buildProjectionError("TAXONOMY_MISSING_REQUIRED_FIELD", "Product id missing.");
    }

    const categoryCloudId = payload.categoryCloudId
      ? String(payload.categoryCloudId)
      : payload.categoryId
        ? String(payload.categoryId)
        : null;
    const gameCloudId = payload.gameCloudId
      ? String(payload.gameCloudId)
      : payload.gameId
        ? String(payload.gameId)
        : null;
    const expansionCloudId = payload.expansionCloudId
      ? String(payload.expansionCloudId)
      : payload.expansionId
        ? String(payload.expansionId)
        : null;

    const categoryRow = categoryCloudId
      ? (categoryByCloudStmt.get(categoryCloudId) as { id: string; name: string } | undefined)
      : undefined;
    if (categoryCloudId && !categoryRow) {
      throw buildProjectionError(
        "TAXONOMY_REFERENCE_NOT_FOUND",
        `Product references missing category taxonomy ${categoryCloudId}.`
      );
    }

    const gameRow = gameCloudId
      ? (gameByCloudStmt.get(gameCloudId) as { id: string; name: string } | undefined)
      : undefined;
    if (gameCloudId && !gameRow) {
      throw buildProjectionError(
        "TAXONOMY_REFERENCE_NOT_FOUND",
        `Product references missing game taxonomy ${gameCloudId}.`
      );
    }

    const expansionRow = expansionCloudId
      ? (expansionByCloudStmt.get(expansionCloudId) as { id: string; name: string } | undefined)
      : undefined;
    if (expansionCloudId && !expansionRow) {
      throw buildProjectionError(
        "TAXONOMY_REFERENCE_NOT_FOUND",
        `Product references missing expansion taxonomy ${expansionCloudId}.`
      );
    }

    const categoryName =
      (typeof payload.categoryName === "string" && payload.categoryName.trim()) ||
      (typeof payload.category === "string" && payload.category.trim()) ||
      categoryRow?.name ||
      "Uncategorized";

    const createdAt = asIso(payload.createdAt, cloudUpdatedAt);

    upsertProductStmt.run(
      localId,
      item.cloudId,
      String(payload.name || "Unnamed product"),
      categoryName,
      categoryCloudId,
      gameCloudId,
      expansionCloudId,
      asMoneyAmount(payload.price, 0),
      gameRow?.id ?? null,
      expansionRow?.id ?? null,
      typeof payload.game === "string" ? payload.game : gameRow?.name ?? null,
      typeof payload.expansion === "string" ? payload.expansion : expansionRow?.name ?? null,
      typeof payload.rarity === "string" ? payload.rarity : null,
      typeof payload.condition === "string" ? payload.condition : null,
      typeof payload.imageUrl === "string" ? payload.imageUrl : null,
      asFlag(payload.isStockTracked, 1),
      isDeleted ? 0 : enabledPOS,
      enabledOnlineStore,
      cloudUpdatedAt,
      isDeleted ? 1 : 0,
      createdAt,
      nowIso
    );

    upsertInventoryStmt.run(localId, asInt(payload.available, 0), cloudUpdatedAt);
    upsertMapStmt.run("PRODUCT", item.cloudId, localId);
    return localId;
  };

  function applyEntity(item: CatalogEntity, stats: ProjectionStats, nowIso: string) {
    const entityType = normalizeEntityType(item.entityType);
    const exists = existsMapStmt.get(entityType, item.cloudId) as { found: number } | undefined;

    if (entityType === "CATEGORY") {
      applyCategory(item, nowIso);
    } else if (entityType === "GAME") {
      applyGame(item, nowIso);
    } else if (entityType === "EXPANSION") {
      applyExpansion(item, nowIso);
    } else {
      applyProduct(item, nowIso);
    }

    if (exists) {
      stats.updated += 1;
    } else {
      stats.inserted += 1;
    }

    const deleted = normalizeDeletion(item.payload ?? {});
    if (deleted) {
      stats.deleted += 1;
    }
  }

  const projectSnapshotTx = db.transaction((items: CatalogEntity[], nowIso: string) => {
    const stats: ProjectionStats = { inserted: 0, updated: 0, disabled: 0, deleted: 0, skipped: 0 };

    const incomingByType = {
      CATEGORY: new Set<string>(),
      GAME: new Set<string>(),
      EXPANSION: new Set<string>(),
      PRODUCT: new Set<string>()
    } as const;

    for (const item of items) {
      const type = normalizeEntityType(item.entityType);
      incomingByType[type].add(item.cloudId);
      try {
        applyEntity(item, stats, nowIso);
      } catch (error) {
        const code = (error as ProjectionError).code;
        if (code === "TAXONOMY_REFERENCE_NOT_FOUND" || code === "TAXONOMY_MISSING_REQUIRED_FIELD") {
          stats.skipped += 1;
          continue;
        }
        throw error;
      }
    }

    stats.disabled += softDisableMissing("categories", incomingByType.CATEGORY);
    stats.disabled += softDisableMissing("game_types", incomingByType.GAME);
    stats.disabled += softDisableMissing("expansions", incomingByType.EXPANSION);
    stats.disabled += softDisableMissing("products", incomingByType.PRODUCT);

    return stats;
  });

  const projectDeltaTx = db.transaction((items: CatalogEntity[], nowIso: string) => {
    const stats: ProjectionStats = { inserted: 0, updated: 0, disabled: 0, deleted: 0, skipped: 0 };

    for (const item of items) {
      try {
        applyEntity(item, stats, nowIso);
      } catch (error) {
        const code = (error as ProjectionError).code;
        if (code === "TAXONOMY_REFERENCE_NOT_FOUND" || code === "TAXONOMY_MISSING_REQUIRED_FIELD") {
          stats.skipped += 1;
          continue;
        }
        throw error;
      }

      const payload = item.payload ?? {};
      const deleted = normalizeDeletion(payload);
      const enabledPOS = asFlag(payload.enabledPOS, 1);
      if (!deleted && enabledPOS === 0) {
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
