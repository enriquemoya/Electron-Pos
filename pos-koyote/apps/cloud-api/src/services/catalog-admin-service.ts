import crypto from "crypto";

import { CatalogAction, CatalogEntityType, CatalogTaxonomyType } from "@prisma/client";

import { prisma } from "../db/prisma";
import { ApiErrors } from "../errors/api-error";

type SortDirection = "asc" | "desc";

type ProductSort = "updatedAt" | "name" | "price";

type TaxonomySort = "name" | "type";

function createCatalogAuditLog(params: {
  entityType: CatalogEntityType;
  entityId: string;
  action: CatalogAction;
  actorUserId: string;
  reason: string;
  payload?: Record<string, unknown> | null;
}) {
  return prisma.catalogAuditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorUserId: params.actorUserId,
      reason: params.reason,
      payload: params.payload ?? null
    }
  });
}

export async function listCatalogProducts(params: {
  page: number;
  pageSize: number;
  query?: string;
  sort?: ProductSort;
  direction?: SortDirection;
}) {
  const skip = (params.page - 1) * params.pageSize;
  const query = params.query?.trim();
  const where = query
    ? {
        OR: [
          { displayName: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { game: { contains: query, mode: "insensitive" } }
        ]
      }
    : undefined;

  const direction = params.direction ?? "desc";
  const orderBy =
    params.sort === "name"
      ? { displayName: direction }
      : params.sort === "price"
        ? { price: direction }
        : { updatedAt: direction };

  const [items, total] = await prisma.$transaction([
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
        game: true,
        price: true,
        imageUrl: true,
        shortDescription: true,
        availabilityState: true,
        isFeatured: true,
        featuredOrder: true,
        available: true
      }
    }),
    prisma.readModelInventory.count({ where })
  ]);

  return { items, total };
}

export async function getCatalogProduct(productId: string) {
  return prisma.readModelInventory.findUnique({
    where: { productId }
  });
}

export async function createCatalogProduct(params: {
  actorUserId: string;
  reason: string;
  name: string;
  slug: string;
  game: string;
  categoryId: string;
  expansionId: string | null;
  price: number;
  imageUrl: string;
  description: string | null;
  rarity: string | null;
  tags: string[] | null;
  isActive: boolean;
  isFeatured: boolean;
  featuredOrder: number | null;
}) {
  const existingSlug = await prisma.readModelInventory.findFirst({
    where: { slug: params.slug }
  });
  if (existingSlug) {
    throw ApiErrors.productSlugExists;
  }

  const category = await prisma.catalogTaxonomy.findFirst({
    where: { id: params.categoryId, type: CatalogTaxonomyType.CATEGORY }
  });
  if (!category) {
    throw ApiErrors.taxonomyNotFound;
  }

  const expansion = params.expansionId
    ? await prisma.catalogTaxonomy.findFirst({
        where: { id: params.expansionId, type: CatalogTaxonomyType.EXPANSION }
      })
    : null;

  const productId = crypto.randomUUID();
  const availabilityState = "OUT_OF_STOCK";

  const [product] = await prisma.$transaction([
    prisma.readModelInventory.create({
      data: {
        productId,
        displayName: params.name,
        slug: params.slug,
        category: category.name,
        categoryId: category.id,
        expansionId: expansion?.id ?? null,
        game: params.game,
        price: params.price,
        imageUrl: params.imageUrl,
        shortDescription: params.description,
        description: params.description,
        rarity: params.rarity,
        tags: params.tags ?? null,
        isActive: params.isActive,
        isFeatured: params.isFeatured,
        featuredOrder: params.featuredOrder,
        availabilityState,
        available: 0
      }
    }),
    createCatalogAuditLog({
      entityType: CatalogEntityType.PRODUCT,
      entityId: productId,
      action: CatalogAction.CREATE,
      actorUserId: params.actorUserId,
      reason: params.reason,
      payload: {
        name: params.name,
        slug: params.slug,
        categoryId: params.categoryId,
        expansionId: params.expansionId,
        game: params.game
      }
    })
  ]);

  return product;
}

export async function updateCatalogProduct(params: {
  productId: string;
  data: Record<string, unknown>;
  actorUserId: string;
  reason: string;
}) {
  if (typeof params.data.slug === "string") {
    const existingSlug = await prisma.readModelInventory.findFirst({
      where: { slug: params.data.slug, NOT: { productId: params.productId } }
    });
    if (existingSlug) {
      throw ApiErrors.productSlugExists;
    }
  }

  if (typeof params.data.categoryId === "string") {
    const category = await prisma.catalogTaxonomy.findFirst({
      where: { id: params.data.categoryId, type: CatalogTaxonomyType.CATEGORY }
    });
    if (!category) {
      throw ApiErrors.taxonomyNotFound;
    }
    params.data.category = category.name;
  }

  if (typeof params.data.expansionId === "string") {
    const expansion = await prisma.catalogTaxonomy.findFirst({
      where: { id: params.data.expansionId, type: CatalogTaxonomyType.EXPANSION }
    });
    if (!expansion) {
      throw ApiErrors.taxonomyNotFound;
    }
  }

  const [product] = await prisma.$transaction([
    prisma.readModelInventory.update({
      where: { productId: params.productId },
      data: params.data
    }),
    createCatalogAuditLog({
      entityType: CatalogEntityType.PRODUCT,
      entityId: params.productId,
      action: CatalogAction.UPDATE,
      actorUserId: params.actorUserId,
      reason: params.reason,
      payload: params.data
    })
  ]);

  return product;
}

export async function listTaxonomies(params: {
  type?: CatalogTaxonomyType;
  page: number;
  pageSize: number;
  query?: string;
  sort?: TaxonomySort;
  direction?: SortDirection;
}) {
  const skip = (params.page - 1) * params.pageSize;
  const query = params.query?.trim();
  const where = {
    ...(params.type ? { type: params.type } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const direction = params.direction ?? "asc";
  const orderBy = params.sort === "type" ? { type: direction } : { name: direction };

  const [items, total] = await prisma.$transaction([
    prisma.catalogTaxonomy.findMany({
      where,
      orderBy,
      skip,
      take: params.pageSize
    }),
    prisma.catalogTaxonomy.count({ where })
  ]);

  return { items, total };
}

export async function createTaxonomy(data: {
  type: CatalogTaxonomyType;
  name: string;
  slug: string;
  description: string | null;
}) {
  return prisma.catalogTaxonomy.create({ data });
}

export async function updateTaxonomy(id: string, data: {
  name?: string;
  slug?: string;
  description?: string | null;
}) {
  return prisma.catalogTaxonomy.update({ where: { id }, data });
}

export async function deleteTaxonomy(id: string) {
  return prisma.catalogTaxonomy.delete({ where: { id } });
}
