import crypto from "crypto";
import { CatalogTaxonomyType, Prisma } from "@prisma/client";

import { withClient } from "../db/pg";
import { prisma } from "../db/prisma";
import { ApiErrors } from "../../errors/api-error";
import { isIsoString } from "../../validation/common";

export async function recordEvents(events: any[]) {
  const accepted: string[] = [];
  const duplicates: string[] = [];

  await withClient(async (client) => {
    for (const event of events) {
      if (!event?.eventId || !event.type || !event.source || !event.payload || !event.occurredAt) {
        throw new Error("invalid event payload");
      }
      if (!isIsoString(event.occurredAt)) {
        throw new Error("invalid occurredAt");
      }

      const eventId = String(event.eventId);
      const idempotencyKey = event.idempotencyKey ? String(event.idempotencyKey) : eventId;
      const existing = await client.query(
        "SELECT event_id FROM sync_events WHERE event_id = $1",
        [idempotencyKey]
      );
      if (existing.rowCount && existing.rowCount > 0) {
        duplicates.push(eventId);
        continue;
      }

      await client.query(
        `INSERT INTO sync_events (id, event_id, type, occurred_at, source, payload, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
        [crypto.randomUUID(), idempotencyKey, event.type, event.occurredAt, event.source, event.payload]
      );
      accepted.push(eventId);
    }
  });

  return { accepted, duplicates };
}

export async function getPendingEvents(posId: string, since: string | null) {
  return withClient(async (client) => {
    const params: (string | null)[] = [posId];
    let where = "WHERE e.event_id NOT IN (SELECT event_id FROM pos_event_ack WHERE pos_id = $1)";
    if (since) {
      params.push(since);
      where += ` AND e.occurred_at >= $${params.length}`;
    }
    const result = await client.query(
      `SELECT e.event_id, e.type, e.occurred_at, e.source, e.payload
       FROM sync_events e
       ${where}
       ORDER BY e.occurred_at ASC, e.event_id ASC`,
      params
    );
    return result.rows;
  });
}

export async function acknowledgeEvents(posId: string, eventIds: string[]) {
  await withClient(async (client) => {
    for (const eventId of eventIds) {
      await client.query(
        "INSERT INTO pos_event_ack (pos_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [posId, eventId]
      );
    }
  });
}

export async function createOrder(orderId: string, items: any[], branchId: string) {
  return withClient(async (client) => {
    const existing = await client.query("SELECT order_id FROM orders WHERE order_id = $1", [orderId]);
    if (existing.rowCount && existing.rowCount > 0) {
      return { duplicate: true };
    }

    await client.query(
      "INSERT INTO orders (id, order_id, status, payload) VALUES ($1, $2, $3, $4)",
      [crypto.randomUUID(), orderId, "CREATED", { items, branchId }]
    );

    const eventId = `order-${orderId}`;
    await client.query(
      `INSERT INTO sync_events (id, event_id, type, occurred_at, source, payload, status)
       VALUES ($1, $2, 'ONLINE_SALE', $3, $4, $5, 'PENDING')
       ON CONFLICT (event_id) DO NOTHING`,
      [crypto.randomUUID(), eventId, new Date().toISOString(), "online-store", { orderId, items, branchId }]
    );

    return { duplicate: false };
  });
}

function buildSnapshotVersion(date: Date | null): string {
  return date ? date.toISOString() : "1970-01-01T00:00:00.000Z";
}

async function ensureBranchCatalogScope(branchId: string) {
  const existing = await prisma.branchCatalogScope.count({
    where: { branchId }
  });
  if (existing > 0) {
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO branch_catalog_scope (branch_id, product_id)
    SELECT ${branchId}::uuid, product_id
    FROM read_model_inventory
    ON CONFLICT (branch_id, product_id) DO NOTHING
  `;
}

function buildVersionHash(params: { updatedAt: Date; available: number; price: Prisma.Decimal | null }) {
  return crypto
    .createHash("sha256")
    .update(`${params.updatedAt.toISOString()}|${params.available}|${params.price ? params.price.toString() : "null"}`)
    .digest("hex");
}

function buildTaxonomyVersionHash(params: { updatedAt: Date; name: string; type: string }) {
  return crypto
    .createHash("sha256")
    .update(`${params.type}|${params.updatedAt.toISOString()}|${params.name}`)
    .digest("hex");
}

function toCatalogEntity(row: {
  productId: string;
  slug: string | null;
  displayName: string | null;
  shortDescription: string | null;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  category: string | null;
  gameId: string | null;
  game: string | null;
  expansionId: string | null;
  expansionName: string | null;
  price: Prisma.Decimal | null;
  available: number;
  updatedAt: Date;
  availabilityState: string | null;
  isActive: boolean;
}) {
  return {
    entityType: "PRODUCT",
    cloudId: row.productId,
    localId: null,
    updatedAt: row.updatedAt.toISOString(),
    versionHash: buildVersionHash({
      updatedAt: row.updatedAt,
      available: row.available,
      price: row.price
    }),
    payload: {
      id: row.productId,
      slug: row.slug ?? null,
      name: row.displayName ?? null,
      shortDescription: row.shortDescription ?? null,
      description: row.description ?? null,
      imageUrl: row.imageUrl ?? null,
      categoryId: row.categoryId ?? null,
      categoryCloudId: row.categoryId ?? null,
      category: row.category ?? null,
      gameId: row.gameId ?? null,
      gameCloudId: row.gameId ?? null,
      game: row.game ?? null,
      expansionId: row.expansionId ?? null,
      expansionCloudId: row.expansionId ?? null,
      expansion: row.expansionName ?? null,
      price: row.price == null ? null : Number(row.price),
      available: row.available,
      availabilityState: row.availabilityState ?? null,
      enabledPOS: row.isActive,
      enabledOnlineStore: row.isActive,
      isDeletedCloud: false
    }
  };
}

type TaxonomyEntity = {
  entityType: "CATEGORY" | "GAME" | "EXPANSION";
  cloudId: string;
  localId: null;
  updatedAt: string;
  versionHash: string;
  payload: {
    id: string;
    name: string;
    slug: string | null;
    type: "CATEGORY" | "GAME" | "EXPANSION";
    gameCloudId?: string | null;
    enabledPOS: boolean;
    enabledOnlineStore: boolean;
    isDeletedCloud: boolean;
    deletedAt: string | null;
  };
};

function toTaxonomyEntity(params: {
  id: string;
  name: string;
  slug: string | null;
  updatedAt: Date;
  type: "CATEGORY" | "GAME" | "EXPANSION";
  gameCloudId?: string | null;
  enabled: boolean;
}): TaxonomyEntity {
  return {
    entityType: params.type,
    cloudId: params.id,
    localId: null,
    updatedAt: params.updatedAt.toISOString(),
    versionHash: buildTaxonomyVersionHash({
      updatedAt: params.updatedAt,
      name: params.name,
      type: params.type
    }),
    payload: {
      id: params.id,
      name: params.name,
      slug: params.slug,
      type: params.type,
      ...(params.type === "EXPANSION" ? { gameCloudId: params.gameCloudId ?? null } : {}),
      enabledPOS: params.enabled,
      enabledOnlineStore: params.enabled,
      isDeletedCloud: false,
      deletedAt: null
    }
  };
}

async function listTaxonomyEntitiesForRows(rows: Array<{
  categoryId: string | null;
  gameId: string | null;
  expansionId: string | null;
  updatedAt: Date;
  isActive: boolean;
}>) {
  const categoryIds = [...new Set(rows.map((row) => row.categoryId).filter((value): value is string => Boolean(value)))];
  const gameIds = [...new Set(rows.map((row) => row.gameId).filter((value): value is string => Boolean(value)))];
  const expansionIds = [...new Set(rows.map((row) => row.expansionId).filter((value): value is string => Boolean(value)))];

  if (categoryIds.length === 0 && gameIds.length === 0 && expansionIds.length === 0) {
    return [] as TaxonomyEntity[];
  }

  const taxonomyRows = await prisma.catalogTaxonomy.findMany({
    where: {
      OR: [
        categoryIds.length > 0 ? { id: { in: categoryIds }, type: CatalogTaxonomyType.CATEGORY } : undefined,
        gameIds.length > 0 ? { id: { in: gameIds }, type: CatalogTaxonomyType.GAME } : undefined,
        expansionIds.length > 0 ? { id: { in: expansionIds }, type: CatalogTaxonomyType.EXPANSION } : undefined
      ].filter(Boolean) as Prisma.CatalogTaxonomyWhereInput[]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      parentId: true,
      updatedAt: true
    }
  });

  const byId = new Map(taxonomyRows.map((row) => [row.id, row]));
  const activityByTaxonomyId = new Map<string, boolean>();
  rows.forEach((row) => {
    const enabled = row.isActive;
    if (row.categoryId) {
      activityByTaxonomyId.set(row.categoryId, activityByTaxonomyId.get(row.categoryId) === false ? false : enabled);
    }
    if (row.gameId) {
      activityByTaxonomyId.set(row.gameId, activityByTaxonomyId.get(row.gameId) === false ? false : enabled);
    }
    if (row.expansionId) {
      activityByTaxonomyId.set(row.expansionId, activityByTaxonomyId.get(row.expansionId) === false ? false : enabled);
    }
  });

  const entities: TaxonomyEntity[] = [];
  for (const taxonomy of taxonomyRows) {
    const enabled = activityByTaxonomyId.get(taxonomy.id) ?? true;
    if (taxonomy.type === CatalogTaxonomyType.CATEGORY) {
      entities.push(
        toTaxonomyEntity({
          id: taxonomy.id,
          name: taxonomy.name,
          slug: taxonomy.slug,
          updatedAt: taxonomy.updatedAt,
          type: "CATEGORY",
          enabled
        })
      );
      continue;
    }
    if (taxonomy.type === CatalogTaxonomyType.GAME) {
      entities.push(
        toTaxonomyEntity({
          id: taxonomy.id,
          name: taxonomy.name,
          slug: taxonomy.slug,
          updatedAt: taxonomy.updatedAt,
          type: "GAME",
          enabled
        })
      );
      continue;
    }
    if (taxonomy.type === CatalogTaxonomyType.EXPANSION) {
      const parent = taxonomy.parentId && byId.has(taxonomy.parentId) ? taxonomy.parentId : taxonomy.parentId;
      entities.push(
        toTaxonomyEntity({
          id: taxonomy.id,
          name: taxonomy.name,
          slug: taxonomy.slug,
          updatedAt: taxonomy.updatedAt,
          type: "EXPANSION",
          gameCloudId: parent ?? null,
          enabled
        })
      );
    }
  }

  return entities;
}

export async function getCatalogSnapshot(params: { branchId: string; page: number; pageSize: number }) {
  const branch = await prisma.pickupBranch.findUnique({
    where: { id: params.branchId },
    select: { id: true }
  });
  if (!branch) {
    throw ApiErrors.branchNotFound;
  }
  await ensureBranchCatalogScope(params.branchId);

  const where: Prisma.ReadModelInventoryWhereInput = {
    branchScopes: { some: { branchId: params.branchId } }
  };
  const branchScopeWhere: Prisma.ReadModelInventoryWhereInput = {
    branchScopes: { some: { branchId: params.branchId } }
  };

  const [items, total, latest] = await prisma.$transaction([
    prisma.readModelInventory.findMany({
      where,
      orderBy: [{ updatedAt: "asc" }, { productId: "asc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        productId: true,
        slug: true,
        displayName: true,
        shortDescription: true,
        description: true,
        imageUrl: true,
        categoryId: true,
        category: true,
        gameId: true,
        game: true,
        expansionId: true,
        price: true,
        available: true,
        updatedAt: true,
        availabilityState: true,
        isActive: true
      }
    }),
    prisma.readModelInventory.count({ where }),
    prisma.readModelInventory.findFirst({
      where: branchScopeWhere,
      orderBy: [{ updatedAt: "desc" }],
      select: { updatedAt: true }
    })
  ]);

  const taxonomyEntities = await listTaxonomyEntitiesForRows(
    items.map((row) => ({
      categoryId: row.categoryId,
      gameId: row.gameId,
      expansionId: row.expansionId,
      updatedAt: row.updatedAt,
      isActive: row.isActive
    }))
  );
  const taxonomyNameById = new Map(
    taxonomyEntities.map((entry) => [entry.cloudId, entry.payload.name])
  );
  const productEntities = items.map((row) =>
    toCatalogEntity({
      ...row,
      expansionName: row.expansionId ? taxonomyNameById.get(row.expansionId) ?? null : null
    })
  );

  return {
    items: [...taxonomyEntities, ...productEntities],
    total,
    snapshotVersion: buildSnapshotVersion(latest?.updatedAt ?? null),
    appliedAt: new Date().toISOString()
  };
}

export async function getCatalogDelta(params: {
  branchId: string;
  since: string | null;
  page: number;
  pageSize: number;
}) {
  const branch = await prisma.pickupBranch.findUnique({
    where: { id: params.branchId },
    select: { id: true }
  });
  if (!branch) {
    throw ApiErrors.branchNotFound;
  }
  await ensureBranchCatalogScope(params.branchId);

  const sinceDate = params.since ? new Date(params.since) : null;
  const where: Prisma.ReadModelInventoryWhereInput = {
    branchScopes: { some: { branchId: params.branchId } },
    ...(sinceDate && !Number.isNaN(sinceDate.getTime()) ? { updatedAt: { gt: sinceDate } } : {})
  };
  const branchScopeWhere: Prisma.ReadModelInventoryWhereInput = {
    branchScopes: { some: { branchId: params.branchId } }
  };
  const [items, total, latest] = await prisma.$transaction([
    prisma.readModelInventory.findMany({
      where,
      orderBy: [{ updatedAt: "asc" }, { productId: "asc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        productId: true,
        slug: true,
        displayName: true,
        shortDescription: true,
        description: true,
        imageUrl: true,
        categoryId: true,
        category: true,
        gameId: true,
        game: true,
        expansionId: true,
        price: true,
        available: true,
        updatedAt: true,
        availabilityState: true,
        isActive: true
      }
    }),
    prisma.readModelInventory.count({ where }),
    prisma.readModelInventory.findFirst({
      where: branchScopeWhere,
      orderBy: [{ updatedAt: "desc" }],
      select: { updatedAt: true }
    })
  ]);

  const taxonomyEntities = await listTaxonomyEntitiesForRows(
    items.map((row) => ({
      categoryId: row.categoryId,
      gameId: row.gameId,
      expansionId: row.expansionId,
      updatedAt: row.updatedAt,
      isActive: row.isActive
    }))
  );
  const taxonomyNameById = new Map(
    taxonomyEntities.map((entry) => [entry.cloudId, entry.payload.name])
  );
  const productEntities = items.map((row) =>
    toCatalogEntity({
      ...row,
      expansionName: row.expansionId ? taxonomyNameById.get(row.expansionId) ?? null : null
    })
  );

  return {
    items: [...taxonomyEntities, ...productEntities],
    total,
    snapshotVersion: buildSnapshotVersion(latest?.updatedAt ?? null),
    appliedAt: new Date().toISOString()
  };
}

export async function reconcileCatalog(params: {
  branchId: string;
  manifest: Array<{
    entityType: string;
    cloudId: string;
    localId: string | null;
    updatedAt: string | null;
    versionHash: string | null;
  }>;
}) {
  const branch = await prisma.pickupBranch.findUnique({
    where: { id: params.branchId },
    select: { id: true }
  });
  if (!branch) {
    throw ApiErrors.branchNotFound;
  }
  await ensureBranchCatalogScope(params.branchId);

  const cloudRows = await prisma.readModelInventory.findMany({
    where: {
      branchScopes: { some: { branchId: params.branchId } }
    },
    select: {
      productId: true,
      categoryId: true,
      gameId: true,
      expansionId: true,
      isActive: true,
      updatedAt: true,
      available: true,
      price: true
    }
  });
  const taxonomyEntities = await listTaxonomyEntitiesForRows(
    cloudRows.map((row) => ({
      categoryId: row.categoryId,
      gameId: row.gameId,
      expansionId: row.expansionId,
      updatedAt: row.updatedAt,
      isActive: row.isActive
    }))
  );

  const cloudMap = new Map<
    string,
    {
      entityType: string;
      cloudId: string;
      updatedAt: string;
      versionHash: string;
    }
  >();
  for (const row of cloudRows) {
    const key = `PRODUCT:${row.productId}`;
    cloudMap.set(key, {
      entityType: "PRODUCT",
      cloudId: row.productId,
      updatedAt: row.updatedAt.toISOString(),
      versionHash: buildVersionHash({
        updatedAt: row.updatedAt,
        available: row.available,
        price: row.price
      })
    });
  }
  for (const taxonomy of taxonomyEntities) {
    const key = `${taxonomy.entityType}:${taxonomy.cloudId}`;
    cloudMap.set(key, {
      entityType: taxonomy.entityType,
      cloudId: taxonomy.cloudId,
      updatedAt: taxonomy.updatedAt,
      versionHash: taxonomy.versionHash
    });
  }

  const manifestMap = new Map(
    params.manifest.map((entry) => [
      `${String(entry.entityType || "").toUpperCase()}:${entry.cloudId}`,
      entry
    ])
  );

  const missing = [...cloudMap.values()]
    .filter((entry) => !manifestMap.has(`${entry.entityType}:${entry.cloudId}`))
    .map((entry) => ({
      entityType: entry.entityType,
      cloudId: entry.cloudId
    }));

  const stale = params.manifest
    .filter((entry) => {
      const key = `${String(entry.entityType || "").toUpperCase()}:${entry.cloudId}`;
      const cloud = cloudMap.get(key);
      if (!cloud) {
        return false;
      }
      if (!entry.versionHash) {
        return true;
      }
      return entry.versionHash !== cloud.versionHash;
    })
    .map((entry) => ({
      entityType: String(entry.entityType || "").toUpperCase(),
      cloudId: entry.cloudId
    }));

  const unknown = params.manifest
    .filter(
      (entry) => !cloudMap.has(`${String(entry.entityType || "").toUpperCase()}:${entry.cloudId}`)
    )
    .map((entry) => ({
      entityType: String(entry.entityType || "").toUpperCase(),
      cloudId: entry.cloudId,
      localId: entry.localId
    }));

  const latest = cloudRows.length
    ? cloudRows.reduce((acc, row) => (row.updatedAt > acc ? row.updatedAt : acc), cloudRows[0].updatedAt)
    : null;

  return {
    missing,
    stale,
    unknown,
    snapshotVersion: buildSnapshotVersion(latest)
  };
}

export async function ingestSalesEvent(params: {
  terminalId: string;
  branchId: string;
  localEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  try {
    await prisma.posSyncEvent.create({
      data: {
        terminalId: params.terminalId,
        branchId: params.branchId,
        localEventId: params.localEventId,
        eventType: params.eventType,
        payload: params.payload as Prisma.InputJsonValue
      }
    });
    return { duplicate: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { duplicate: true };
    }
    throw ApiErrors.posSyncStorageFailed;
  }
}

export async function readProducts(params: {
  page: number;
  pageSize: number;
  id: string | null;
  gameId?: string | "misc" | null;
  categoryId?: string | null;
  expansionId?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
}) {
  const where: Prisma.ReadModelInventoryWhereInput = {};

  if (params.id) {
    where.productId = params.id;
  }
  if (params.gameId === "misc") {
    where.gameId = null;
  } else if (params.gameId) {
    where.gameId = params.gameId;
  }
  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }
  if (params.expansionId) {
    where.expansionId = params.expansionId;
  }
  if (params.priceMin != null || params.priceMax != null) {
    where.price = {
      ...(params.priceMin != null ? { gte: params.priceMin } : {}),
      ...(params.priceMax != null ? { lte: params.priceMax } : {})
    };
  }

  const [items, total] = await prisma.$transaction([
    prisma.readModelInventory.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        productId: true,
        slug: true,
        available: true,
        updatedAt: true,
        displayName: true,
        shortDescription: true,
        price: true,
        imageUrl: true,
        category: true,
        categoryId: true,
        game: true,
        gameId: true,
        expansionId: true,
        availabilityState: true,
        lastSyncedAt: true
      }
    }),
    prisma.readModelInventory.count({ where })
  ]);

  const result = items.map((row) => {
    const derivedState = (() => {
      if (!row.lastSyncedAt) {
        return "PENDING_SYNC";
      }
      if (row.available <= 0) {
        return "SOLD_OUT";
      }
      if (row.available <= 2) {
        return "LOW_STOCK";
      }
      return "AVAILABLE";
    })();

    return {
      id: row.productId,
      slug: row.slug ?? null,
      name: row.displayName ?? null,
      category: row.category ?? null,
      categoryId: row.categoryId ?? null,
      price: row.price === null ? null : { amount: Number(row.price), currency: "MXN" },
      game: row.game ?? null,
      gameId: row.gameId ?? null,
      expansionId: row.expansionId ?? null,
      imageUrl: row.imageUrl ?? null,
      available: row.available,
      state: row.availabilityState ?? derivedState,
      updatedAt: row.updatedAt,
      shortDescription: row.shortDescription ?? null,
      lastSyncedAt: row.lastSyncedAt ?? null
    };
  });

  return { items: result, total };
}
