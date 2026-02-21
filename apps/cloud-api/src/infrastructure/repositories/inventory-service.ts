import { randomUUID } from "crypto";
import { Prisma, InventoryMovementActorRole } from "@prisma/client";

import { ApiErrors } from "../../errors/api-error";
import { prisma } from "../db/prisma";

type ScopeType = "ONLINE_STORE" | "BRANCH";

function normalizeScope(params: { scopeType?: ScopeType; branchId?: string | null }) {
  const scopeType = params.scopeType ?? "ONLINE_STORE";
  const branchId = params.branchId ?? null;

  if (scopeType === "ONLINE_STORE" && branchId) {
    throw ApiErrors.inventoryScopeInvalid;
  }
  if (scopeType === "BRANCH" && !branchId) {
    throw ApiErrors.inventoryBranchRequired;
  }

  return { scopeType, branchId };
}

async function loadScopedStockMap(params: {
  productIds: string[];
  scopeType: ScopeType;
  branchId: string | null;
}) {
  if (params.productIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await prisma.inventoryStock.findMany({
    where: {
      productId: { in: params.productIds },
      scopeType: params.scopeType,
      branchId: params.branchId
    },
    select: {
      productId: true,
      quantity: true
    }
  });

  return new Map(rows.map((row) => [row.productId, row.quantity]));
}

function mapItem(
  row: {
    productId: string;
    displayName: string | null;
    slug: string | null;
    category: string | null;
    categoryId: string | null;
    game: string | null;
    gameId: string | null;
    expansionId: string | null;
    price: Prisma.Decimal | null;
    imageUrl: string | null;
    updatedAt: Date;
  },
  quantity: number,
  scopeType: ScopeType,
  branchId: string | null
) {
  return {
    productId: row.productId,
    displayName: row.displayName,
    slug: row.slug,
    category: row.category,
    categoryId: row.categoryId,
    game: row.game,
    gameId: row.gameId,
    expansionId: row.expansionId,
    available: quantity,
    price: row.price === null ? null : Number(row.price),
    imageUrl: row.imageUrl,
    updatedAt: row.updatedAt,
    scopeType,
    branchId
  };
}

export async function listInventory(params: {
  page: number;
  pageSize: number;
  query?: string;
  sort?: "updatedAt" | "available" | "name";
  direction?: "asc" | "desc";
  scopeType?: ScopeType;
  branchId?: string | null;
}) {
  const scope = normalizeScope({ scopeType: params.scopeType, branchId: params.branchId });
  const query = params.query?.trim();
  const direction = params.direction ?? "desc";
  const skip = (params.page - 1) * params.pageSize;

  const where = query
    ? {
        OR: [
          { displayName: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { slug: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { category: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { game: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { productId: { contains: query, mode: Prisma.QueryMode.insensitive } }
        ]
      }
    : undefined;

  if (params.sort === "available") {
    const rows = await prisma.readModelInventory.findMany({
      where,
      select: {
        productId: true,
        displayName: true,
        slug: true,
        category: true,
        categoryId: true,
        game: true,
        gameId: true,
        expansionId: true,
        price: true,
        imageUrl: true,
        updatedAt: true
      }
    });

    const stockByProduct = await loadScopedStockMap({
      productIds: rows.map((row) => row.productId),
      scopeType: scope.scopeType,
      branchId: scope.branchId
    });

    const sorted = rows
      .map((row) => ({ row, quantity: stockByProduct.get(row.productId) ?? 0 }))
      .sort((a, b) => {
        if (direction === "asc") {
          return a.quantity - b.quantity;
        }
        return b.quantity - a.quantity;
      });

    const pageRows = sorted.slice(skip, skip + params.pageSize);
    return {
      items: pageRows.map((entry) => mapItem(entry.row, entry.quantity, scope.scopeType, scope.branchId)),
      total: sorted.length
    };
  }

  const orderBy =
    params.sort === "name"
      ? { displayName: direction }
      : { updatedAt: direction };

  const [rows, total] = await prisma.$transaction([
    prisma.readModelInventory.findMany({
      where,
      orderBy,
      skip,
      take: params.pageSize,
      select: {
        productId: true,
        displayName: true,
        slug: true,
        category: true,
        categoryId: true,
        game: true,
        gameId: true,
        expansionId: true,
        price: true,
        imageUrl: true,
        updatedAt: true
      }
    }),
    prisma.readModelInventory.count({ where })
  ]);

  const stockByProduct = await loadScopedStockMap({
    productIds: rows.map((row) => row.productId),
    scopeType: scope.scopeType,
    branchId: scope.branchId
  });

  return {
    items: rows.map((row) =>
      mapItem(row, stockByProduct.get(row.productId) ?? 0, scope.scopeType, scope.branchId)
    ),
    total
  };
}

async function createScopedMovement(params: {
  productId: string;
  scopeType: ScopeType;
  branchId: string | null;
  delta: number;
  reason: string;
  actorRole: "ADMIN" | "EMPLOYEE" | "TERMINAL";
  actorUserId?: string | null;
  actorTerminalId?: string | null;
  idempotencyKey: string;
}) {
  const scope = normalizeScope({ scopeType: params.scopeType, branchId: params.branchId });

  if (!Number.isInteger(params.delta) || params.delta === 0) {
    throw ApiErrors.inventoryInvalid;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingMovement = await tx.inventoryMovement.findFirst({
        where: { idempotencyKey: params.idempotencyKey },
        include: { product: true }
      });
      if (existingMovement) {
        return {
          item: {
            productId: existingMovement.productId,
            displayName: existingMovement.product.displayName,
            available: existingMovement.newQuantity,
            scopeType: existingMovement.scopeType,
            branchId: existingMovement.branchId,
            updatedAt: existingMovement.createdAt
          },
          adjustment: {
            id: existingMovement.id,
            productId: existingMovement.productId,
            delta: existingMovement.delta,
            reason: existingMovement.reason,
            scopeType: existingMovement.scopeType,
            branchId: existingMovement.branchId,
            actorRole: existingMovement.actorRole,
            previousQuantity: existingMovement.previousQuantity,
            newQuantity: existingMovement.newQuantity,
            idempotencyKey: existingMovement.idempotencyKey,
            createdAt: existingMovement.createdAt
          }
        };
      }

      const product = await tx.readModelInventory.findUnique({
        where: { productId: params.productId },
        select: {
          productId: true,
          displayName: true
        }
      });
      if (!product) {
        return null;
      }

      const stock = await tx.inventoryStock.findFirst({
        where: {
          productId: params.productId,
          scopeType: scope.scopeType,
          branchId: scope.branchId
        }
      });

      const previousQuantity = stock?.quantity ?? 0;
      const newQuantity = previousQuantity + params.delta;
      if (newQuantity < 0) {
        throw ApiErrors.inventoryNegativeNotAllowed;
      }

      const now = new Date();
      if (stock) {
        await tx.inventoryStock.update({
          where: { id: stock.id },
          data: {
            quantity: newQuantity,
            updatedAt: now
          }
        });
      } else {
        await tx.inventoryStock.create({
          data: {
            productId: params.productId,
            scopeType: scope.scopeType,
            branchId: scope.branchId,
            quantity: newQuantity,
            updatedAt: now
          }
        });
      }

      const movement = await tx.inventoryMovement.create({
        data: {
          productId: params.productId,
          scopeType: scope.scopeType,
          branchId: scope.branchId,
          delta: params.delta,
          reason: params.reason,
          actorRole: params.actorRole as InventoryMovementActorRole,
          actorUserId: params.actorUserId ?? null,
          actorTerminalId: params.actorTerminalId ?? null,
          idempotencyKey: params.idempotencyKey,
          previousQuantity,
          newQuantity
        }
      });

      return {
        item: {
          productId: product.productId,
          displayName: product.displayName,
          available: newQuantity,
          scopeType: scope.scopeType,
          branchId: scope.branchId,
          updatedAt: now
        },
        adjustment: {
          id: movement.id,
          productId: movement.productId,
          delta: movement.delta,
          reason: movement.reason,
          scopeType: movement.scopeType,
          branchId: movement.branchId,
          actorRole: movement.actorRole,
          previousQuantity: movement.previousQuantity,
          newQuantity: movement.newQuantity,
          idempotencyKey: movement.idempotencyKey,
          createdAt: movement.createdAt
        }
      };
    });

    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw ApiErrors.inventoryMovementDuplicate;
    }
    if (error instanceof Error && (error as { code?: string }).code === ApiErrors.inventoryNegativeNotAllowed.code) {
      throw error;
    }
    throw ApiErrors.inventoryStockWriteFailed;
  }
}

export async function adjustInventory(params: {
  productId: string;
  delta: number;
  reason: string;
  actorUserId: string;
  scopeType?: ScopeType;
  branchId?: string | null;
  idempotencyKey?: string | null;
}) {
  return createScopedMovement({
    productId: params.productId,
    scopeType: params.scopeType ?? "ONLINE_STORE",
    branchId: params.branchId ?? null,
    delta: params.delta,
    reason: params.reason,
    actorRole: "ADMIN",
    actorUserId: params.actorUserId,
    idempotencyKey: params.idempotencyKey ?? randomUUID()
  });
}

export async function createMovement(params: {
  productId: string;
  scopeType: ScopeType;
  branchId: string | null;
  delta: number;
  reason: string;
  actorRole: "ADMIN" | "EMPLOYEE" | "TERMINAL";
  actorUserId?: string | null;
  actorTerminalId?: string | null;
  idempotencyKey: string;
}) {
  return createScopedMovement(params);
}

function deriveMovementType(reason: string) {
  const normalized = reason.toLowerCase();
  if (normalized.includes("order") || normalized.includes("sale")) {
    return "ORDER";
  }
  if (normalized.includes("transfer")) {
    return "TRANSFER";
  }
  if (normalized.includes("correction")) {
    return "CORRECTION";
  }
  return "MANUAL";
}

export async function getInventoryStockDetail(params: { productId: string }) {
  const product = await prisma.readModelInventory.findUnique({
    where: { productId: params.productId },
    select: {
      productId: true,
      displayName: true,
      slug: true,
      category: true,
      categoryId: true,
      game: true,
      gameId: true,
      expansionId: true,
      imageUrl: true,
      updatedAt: true
    }
  });

  if (!product) {
    return null;
  }

  const [branches, stocks] = await prisma.$transaction([
    prisma.pickupBranch.findMany({
      select: {
        id: true,
        name: true,
        city: true
      },
      orderBy: { name: "asc" }
    }),
    prisma.inventoryStock.findMany({
      where: { productId: params.productId },
      select: {
        scopeType: true,
        branchId: true,
        quantity: true,
        updatedAt: true
      }
    })
  ]);

  const onlineStore = stocks.find((row) => row.scopeType === "ONLINE_STORE" && row.branchId === null);
  const branchStockMap = new Map(
    stocks
      .filter((row) => row.scopeType === "BRANCH" && row.branchId)
      .map((row) => [row.branchId as string, row])
  );

  const branchRows = branches.map((branch) => {
    const row = branchStockMap.get(branch.id);
    const available = row?.quantity ?? 0;
    return {
      branchId: branch.id,
      branchName: branch.name,
      branchCity: branch.city,
      available,
      reserved: 0,
      total: available,
      updatedAt: row?.updatedAt?.toISOString() ?? null
    };
  });

  const globalQuantity = branchRows.reduce((acc, row) => acc + row.available, 0) + (onlineStore?.quantity ?? 0);

  return {
    product: {
      productId: product.productId,
      displayName: product.displayName,
      slug: product.slug,
      category: product.category,
      categoryId: product.categoryId,
      game: product.game,
      gameId: product.gameId,
      expansionId: product.expansionId,
      imageUrl: product.imageUrl,
      updatedAt: product.updatedAt.toISOString()
    },
    summary: {
      globalQuantity,
      onlineStoreQuantity: onlineStore?.quantity ?? 0,
      lowStockThreshold: 5
    },
    branches: branchRows
  };
}

export async function listInventoryMovements(params: {
  page: number;
  pageSize: number;
  productId?: string;
  branchId?: string | null;
  scopeType?: ScopeType;
  direction?: "asc" | "desc";
  from?: string | null;
  to?: string | null;
}) {
  const direction = params.direction ?? "desc";
  const skip = (params.page - 1) * params.pageSize;
  const where: Prisma.InventoryMovementWhereInput = {};

  if (params.productId) {
    where.productId = params.productId;
  }

  if (params.scopeType) {
    const scope = normalizeScope({
      scopeType: params.scopeType,
      branchId: params.scopeType === "BRANCH" ? params.branchId ?? null : null
    });
    where.scopeType = scope.scopeType;
    where.branchId = scope.branchId;
  } else if (params.branchId) {
    where.branchId = params.branchId;
  }

  if (params.from || params.to) {
    where.createdAt = {
      gte: params.from ? new Date(params.from) : undefined,
      lte: params.to ? new Date(params.to) : undefined
    };
  }

  const [rows, total] = await prisma.$transaction([
    prisma.inventoryMovement.findMany({
      where,
      skip,
      take: params.pageSize,
      orderBy: { createdAt: direction },
      include: {
        branch: {
          select: { id: true, name: true }
        },
        actorUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        actorTerminal: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.inventoryMovement.count({ where })
  ]);

  return {
    items: rows.map((row) => {
      const actorDisplayName =
        row.actorUser
          ? [row.actorUser.firstName, row.actorUser.lastName].filter(Boolean).join(" ").trim() ||
            row.actorUser.email ||
            row.actorUser.id
          : row.actorTerminal?.name || row.actorTerminalId || "SYSTEM";

      return {
        id: row.id,
        productId: row.productId,
        scopeType: row.scopeType,
        branchId: row.branchId,
        branchName: row.branch?.name ?? null,
        actorRole: row.actorRole,
        actorDisplayName,
        actorUserId: row.actorUserId,
        actorTerminalId: row.actorTerminalId,
        movementType: deriveMovementType(row.reason),
        delta: row.delta,
        reason: row.reason,
        previousQuantity: row.previousQuantity,
        newQuantity: row.newQuantity,
        createdAt: row.createdAt.toISOString()
      };
    }),
    total
  };
}
