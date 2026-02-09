import { Prisma } from "@prisma/client";

import { prisma } from "../db/prisma";
import { ApiErrors } from "../../errors/api-error";

const LOW_STOCK_THRESHOLD = 3;
const EXPIRATION_DAYS = 10;

function toAvailability(available: number) {
  if (available <= 0) {
    return "out_of_stock";
  }
  if (available <= LOW_STOCK_THRESHOLD) {
    return "low_stock";
  }
  return "in_stock";
}

function toSnapshotPrice(value: Prisma.Decimal | null) {
  if (value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchInventorySnapshots(productIds: string[]) {
  if (productIds.length === 0) {
    return [];
  }
  return prisma.readModelInventory.findMany({
    where: { productId: { in: productIds } },
    select: {
      productId: true,
      available: true,
      price: true
    }
  });
}

function buildSnapshots(params: {
  items: Array<{ productId: string; quantity: number }>;
  inventoryRows: Array<{ productId: string; available: number; price: Prisma.Decimal | null }>;
}) {
  const inventoryMap = new Map(
    params.inventoryRows.map((row) => [row.productId, { available: row.available, price: row.price }])
  );

  const normalized: Array<{
    productId: string;
    quantity: number;
    priceSnapshot: number;
    currency: string;
    availabilitySnapshot: string;
  }> = [];
  const removedItems: Array<{ productId: string; reason: "insufficient" | "missing" }> = [];

  params.items.forEach((item) => {
    const record = inventoryMap.get(item.productId);
    if (!record) {
      removedItems.push({ productId: item.productId, reason: "missing" });
      return;
    }
    if (record.available <= 0 || record.available < item.quantity) {
      removedItems.push({ productId: item.productId, reason: "insufficient" });
      return;
    }
    const priceSnapshot = toSnapshotPrice(record.price);
    if (priceSnapshot === null) {
      removedItems.push({ productId: item.productId, reason: "missing" });
      return;
    }
    normalized.push({
      productId: item.productId,
      quantity: item.quantity,
      priceSnapshot,
      currency: "MXN",
      availabilitySnapshot: toAvailability(record.available)
    });
  });

  return { items: normalized, removedItems };
}

export async function createOrUpdateDraft(params: {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    priceSnapshot?: number | null;
    availabilitySnapshot?: string | null;
  }>;
}) {
  const productIds = params.items.map((item) => item.productId);
  const inventoryRows = await fetchInventorySnapshots(productIds);
  const snapshots = buildSnapshots({ items: params.items, inventoryRows });

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.preorderDraft.findFirst({
      where: { userId: params.userId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" }
    });

    const draft = existing
      ? await tx.preorderDraft.update({
          where: { id: existing.id },
          data: { updatedAt: new Date() }
        })
      : await tx.preorderDraft.create({
          data: { userId: params.userId, status: "ACTIVE" }
        });

    await tx.preorderDraftItem.deleteMany({ where: { draftId: draft.id } });

    if (snapshots.items.length) {
      await tx.preorderDraftItem.createMany({
        data: snapshots.items.map((item) => ({
          draftId: draft.id,
          productId: item.productId,
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot,
          currency: item.currency,
          availabilitySnapshot: item.availabilitySnapshot
        }))
      });
    }

    return { draftId: draft.id, items: snapshots.items, removedItems: snapshots.removedItems };
  });

  return result;
}

export async function getActiveDraft(params: { userId: string }) {
  const draft = await prisma.preorderDraft.findFirst({
    where: { userId: params.userId, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    include: { items: true }
  });

  if (!draft) {
    return null;
  }

  const productIds = draft.items.map((item) => item.productId);
  const inventoryRows = await prisma.readModelInventory.findMany({
    where: { productId: { in: productIds } },
    select: {
      productId: true,
      displayName: true,
      slug: true,
      imageUrl: true,
      game: true
    }
  });
  const inventoryMap = new Map(
    inventoryRows.map((row) => [
      row.productId,
      {
        name: row.displayName ?? null,
        slug: row.slug ?? null,
        imageUrl: row.imageUrl ?? null,
        game: row.game ?? null
      }
    ])
  );

  return {
    draftId: draft.id,
    items: draft.items.map((item) => {
      const info = inventoryMap.get(item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        priceSnapshot: Number(item.priceSnapshot),
        currency: item.currency,
        availabilitySnapshot: item.availabilitySnapshot,
        name: info?.name ?? item.productId,
        slug: info?.slug ?? null,
        imageUrl: info?.imageUrl ?? null,
        game: info?.game ?? null
      };
    })
  };
}

export async function revalidateItems(params: {
  items: Array<{ productId: string; quantity: number }>;
}) {
  const productIds = params.items.map((item) => item.productId);
  const inventoryRows = await fetchInventorySnapshots(productIds);
  return buildSnapshots({ items: params.items, inventoryRows });
}

async function expireOrders(tx: Prisma.TransactionClient, now: Date) {
  const expiredOrders = await tx.onlineOrder.findMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { lt: now } },
    include: { reservations: true }
  });

  if (expiredOrders.length === 0) {
    return;
  }

  for (const order of expiredOrders) {
    for (const reservation of order.reservations) {
      if (reservation.status !== "ACTIVE") {
        continue;
      }
      await tx.readModelInventory.updateMany({
        where: { productId: reservation.productId },
        data: { available: { increment: reservation.quantity } }
      });
    }

    await tx.inventoryReservation.updateMany({
      where: { orderId: order.id, status: "ACTIVE" },
      data: { status: "RELEASED", releasedAt: now }
    });

    await tx.onlineOrder.update({
      where: { id: order.id },
      data: { status: "CANCELLED_EXPIRED" }
    });
  }
}

export async function createOrder(params: {
  userId: string;
  draftId: string;
  paymentMethod: "PAY_IN_STORE";
  pickupBranchId: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    await expireOrders(tx, new Date());

    const existingOrder = await tx.onlineOrder.findFirst({
      where: { draftId: params.draftId }
    });

    if (existingOrder) {
      return {
        orderId: existingOrder.id,
        status: existingOrder.status,
        expiresAt: existingOrder.expiresAt.toISOString()
      };
    }

    const draft = await tx.preorderDraft.findFirst({
      where: { id: params.draftId, userId: params.userId },
      include: { items: true }
    });

    if (!draft) {
      throw ApiErrors.checkoutDraftNotFound;
    }

    if (draft.status !== "ACTIVE") {
      throw ApiErrors.checkoutDraftInactive;
    }

    if (params.pickupBranchId) {
      const branch = await tx.pickupBranch.findUnique({ where: { id: params.pickupBranchId } });
      if (!branch) {
        throw ApiErrors.branchNotFound;
      }
    }

    if (!draft.items.length) {
      throw ApiErrors.checkoutDraftEmpty;
    }

    const productIds = draft.items.map((item) => item.productId);
    const inventoryRows = await tx.readModelInventory.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, available: true }
    });
    const inventoryMap = new Map(inventoryRows.map((row) => [row.productId, row.available]));

    for (const item of draft.items) {
      const available = inventoryMap.get(item.productId);
      if (available === undefined || available < item.quantity || available <= 0) {
        throw ApiErrors.checkoutInventoryInsufficient;
      }
    }

    const subtotal = draft.items.reduce((sum, item) => {
      const price = Number(item.priceSnapshot);
      return sum + price * item.quantity;
    }, 0);

    const expiresAt = new Date(Date.now() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

    const order = await tx.onlineOrder.create({
      data: {
        userId: params.userId,
        draftId: draft.id,
        status: "PENDING_PAYMENT",
        paymentMethod: params.paymentMethod,
        pickupBranchId: params.pickupBranchId,
        subtotal: new Prisma.Decimal(subtotal),
        currency: "MXN",
        expiresAt
      }
    });

    await tx.onlineOrderItem.createMany({
      data: draft.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        currency: item.currency,
        availabilitySnapshot: item.availabilitySnapshot
      }))
    });

    await tx.inventoryReservation.createMany({
      data: draft.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        status: "ACTIVE",
        expiresAt
      }))
    });

    for (const item of draft.items) {
      await tx.readModelInventory.update({
        where: { productId: item.productId },
        data: { available: { decrement: item.quantity } }
      });
    }

    await tx.preorderDraft.update({
      where: { id: draft.id },
      data: { status: "CONVERTED" }
    });

    return { orderId: order.id, status: order.status, expiresAt: order.expiresAt.toISOString() };
  });
}

export async function getOrder(params: { userId: string; orderId: string }) {
  return prisma.$transaction(async (tx) => {
    await expireOrders(tx, new Date());

    const order = await tx.onlineOrder.findFirst({
      where: { id: params.orderId, userId: params.userId },
      include: { items: true, pickupBranch: true }
    });

    if (!order) {
      return null;
    }

    return {
      id: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      currency: order.currency,
      expiresAt: order.expiresAt,
      pickupBranch: order.pickupBranch,
      items: order.items
    };
  });
}
