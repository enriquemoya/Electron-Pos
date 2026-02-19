import crypto from "crypto";
import { Prisma } from "@prisma/client";

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

function buildVersionHash(params: { updatedAt: Date; available: number; price: Prisma.Decimal | null }) {
  return crypto
    .createHash("sha256")
    .update(`${params.updatedAt.toISOString()}|${params.available}|${params.price ? params.price.toString() : "null"}`)
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
  price: Prisma.Decimal | null;
  available: number;
  updatedAt: Date;
  availabilityState: string | null;
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
      category: row.category ?? null,
      gameId: row.gameId ?? null,
      game: row.game ?? null,
      expansionId: row.expansionId ?? null,
      price: row.price == null ? null : Number(row.price),
      available: row.available,
      availabilityState: row.availabilityState ?? null
    }
  };
}

export async function getCatalogSnapshot(params: { branchId: string; page: number; pageSize: number }) {
  const branch = await prisma.pickupBranch.findUnique({
    where: { id: params.branchId },
    select: { id: true }
  });
  if (!branch) {
    throw ApiErrors.branchNotFound;
  }

  const where: Prisma.ReadModelInventoryWhereInput = {};
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
        availabilityState: true
      }
    }),
    prisma.readModelInventory.count({ where }),
    prisma.readModelInventory.findFirst({
      where,
      orderBy: [{ updatedAt: "desc" }],
      select: { updatedAt: true }
    })
  ]);

  return {
    items: items.map(toCatalogEntity),
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

  const sinceDate = params.since ? new Date(params.since) : null;
  const where: Prisma.ReadModelInventoryWhereInput = {
    ...(sinceDate && !Number.isNaN(sinceDate.getTime()) ? { updatedAt: { gt: sinceDate } } : {})
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
        availabilityState: true
      }
    }),
    prisma.readModelInventory.count({ where }),
    prisma.readModelInventory.findFirst({
      where,
      orderBy: [{ updatedAt: "desc" }],
      select: { updatedAt: true }
    })
  ]);

  return {
    items: items.map(toCatalogEntity),
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

  const cloudRows = await prisma.readModelInventory.findMany({
    select: {
      productId: true,
      updatedAt: true,
      available: true,
      price: true
    }
  });
  const cloudMap = new Map(
    cloudRows.map((row) => [
      row.productId,
      {
        cloudId: row.productId,
        updatedAt: row.updatedAt.toISOString(),
        versionHash: buildVersionHash({
          updatedAt: row.updatedAt,
          available: row.available,
          price: row.price
        })
      }
    ])
  );
  const manifestMap = new Map(params.manifest.map((entry) => [entry.cloudId, entry]));

  const missing = cloudRows
    .filter((row) => !manifestMap.has(row.productId))
    .map((row) => ({
      entityType: "PRODUCT",
      cloudId: row.productId
    }));

  const stale = params.manifest
    .filter((entry) => {
      const cloud = cloudMap.get(entry.cloudId);
      if (!cloud) {
        return false;
      }
      if (!entry.versionHash) {
        return true;
      }
      return entry.versionHash !== cloud.versionHash;
    })
    .map((entry) => ({
      entityType: entry.entityType,
      cloudId: entry.cloudId
    }));

  const unknown = params.manifest
    .filter((entry) => !cloudMap.has(entry.cloudId))
    .map((entry) => ({
      entityType: entry.entityType,
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
