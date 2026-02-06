import type { Request, Response } from "express";
import { Prisma, CatalogTaxonomyType } from "@prisma/client";

import { ApiErrors, asApiError } from "../errors/api-error";
import { isPositiveNumber, parsePage } from "../validation/common";
import { validateProductCreate, validateProductUpdate, validateTaxonomyCreate, validateTaxonomyUpdate } from "../validation/catalog";
import {
  createCatalogProduct,
  createTaxonomy,
  deleteTaxonomy,
  getCatalogProduct,
  listCatalogProducts,
  listTaxonomies,
  updateCatalogProduct,
  updateTaxonomy
} from "../services/catalog-admin-service";

function mapTaxonomyError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return ApiErrors.taxonomyInvalid;
    }
    if (error.code === "P2025") {
      return ApiErrors.taxonomyNotFound;
    }
  }
  return null;
}

function mapProductError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return ApiErrors.productNotFound;
    }
  }
  return null;
}

function getAuthUserId(req: Request) {
  return (req as Request & { auth?: { userId: string } }).auth?.userId;
}

export async function listCatalogProductsHandler(req: Request, res: Response) {
  const page = parsePage(req.query.page, 1);
  const pageSize = parsePage(req.query.pageSize, 25);
  const query = typeof req.query.query === "string" ? req.query.query : undefined;
  const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
  const direction = req.query.direction === "asc" ? "asc" : "desc";
  const allowedSizes = new Set([20, 50, 100]);

  if (!isPositiveNumber(page) || !isPositiveNumber(pageSize) || !allowedSizes.has(pageSize)) {
    res.status(ApiErrors.adminPaginationInvalid.status).json({ error: ApiErrors.adminPaginationInvalid.message });
    return;
  }

  try {
    const result = await listCatalogProducts({
      page,
      pageSize,
      query,
      sort: sort === "name" || sort === "price" ? sort : "updatedAt",
      direction
    });
    res.status(200).json({
      items: result.items,
      page,
      pageSize,
      total: result.total,
      hasMore: page * pageSize < result.total
    });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function getCatalogProductHandler(req: Request, res: Response) {
  const productId = String(req.params.productId || "");
  try {
    const product = await getCatalogProduct(productId);
    if (!product) {
      res.status(ApiErrors.productNotFound.status).json({ error: ApiErrors.productNotFound.message });
      return;
    }
    res.status(200).json({ product });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function createCatalogProductHandler(req: Request, res: Response) {
  const actorUserId = getAuthUserId(req);
  if (!actorUserId) {
    res.status(ApiErrors.unauthorized.status).json({ error: ApiErrors.unauthorized.message });
    return;
  }

  try {
    const payload = validateProductCreate(req.body ?? {});
    const product = await createCatalogProduct({
      actorUserId,
      reason: payload.reason,
      name: payload.name,
      slug: payload.slug,
      game: payload.game,
      categoryId: payload.categoryId,
      expansionId: payload.expansionId,
      price: payload.price,
      imageUrl: payload.imageUrl,
      description: payload.description,
      rarity: payload.rarity,
      tags: payload.tags,
      isActive: payload.isActive,
      isFeatured: payload.isFeatured,
      featuredOrder: payload.featuredOrder
    });
    res.status(201).json({ product });
  } catch (error) {
    if (error === ApiErrors.productSlugExists) {
      res.status(ApiErrors.productSlugExists.status).json({ error: ApiErrors.productSlugExists.message });
      return;
    }
    const apiError = asApiError(error, ApiErrors.productInvalid);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function updateCatalogProductHandler(req: Request, res: Response) {
  const actorUserId = getAuthUserId(req);
  if (!actorUserId) {
    res.status(ApiErrors.unauthorized.status).json({ error: ApiErrors.unauthorized.message });
    return;
  }

  const productId = String(req.params.productId || "");
  try {
    const payload = validateProductUpdate(req.body ?? {});
    const product = await updateCatalogProduct({
      productId,
      data: payload.data,
      actorUserId,
      reason: payload.reason
    });
    res.status(200).json({ product });
  } catch (error) {
    if (error === ApiErrors.productSlugExists) {
      res.status(ApiErrors.productSlugExists.status).json({ error: ApiErrors.productSlugExists.message });
      return;
    }
    const prismaError = mapProductError(error);
    if (prismaError) {
      res.status(prismaError.status).json({ error: prismaError.message });
      return;
    }
    const apiError = asApiError(error, ApiErrors.productInvalid);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function listTaxonomiesHandler(req: Request, res: Response) {
  const typeParam = typeof req.query.type === "string" ? req.query.type.toUpperCase() : undefined;
  const type = typeParam && ["CATEGORY", "GAME", "EXPANSION", "OTHER"].includes(typeParam)
    ? (typeParam as CatalogTaxonomyType)
    : undefined;
  const page = parsePage(req.query.page, 1);
  const pageSize = parsePage(req.query.pageSize, 25);
  const query = typeof req.query.query === "string" ? req.query.query : undefined;
  const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
  const direction = req.query.direction === "desc" ? "desc" : "asc";
  const allowedSizes = new Set([20, 50, 100]);

  if (!isPositiveNumber(page) || !isPositiveNumber(pageSize) || !allowedSizes.has(pageSize)) {
    res.status(ApiErrors.adminPaginationInvalid.status).json({ error: ApiErrors.adminPaginationInvalid.message });
    return;
  }

  try {
    const result = await listTaxonomies({
      type,
      page,
      pageSize,
      query,
      sort: sort === "type" ? "type" : "name",
      direction
    });
    res.status(200).json({
      items: result.items,
      page,
      pageSize,
      total: result.total,
      hasMore: page * pageSize < result.total
    });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function createTaxonomyHandler(req: Request, res: Response) {
  try {
    const payload = validateTaxonomyCreate(req.body ?? {});
    const item = await createTaxonomy(payload);
    res.status(201).json({ item });
  } catch (error) {
    const prismaError = mapTaxonomyError(error);
    if (prismaError) {
      res.status(prismaError.status).json({ error: prismaError.message });
      return;
    }
    const apiError = asApiError(error, ApiErrors.taxonomyInvalid);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function updateTaxonomyHandler(req: Request, res: Response) {
  const id = String(req.params.id || "");
  try {
    const payload = validateTaxonomyUpdate(req.body ?? {});
    const item = await updateTaxonomy(id, payload);
    res.status(200).json({ item });
  } catch (error) {
    const prismaError = mapTaxonomyError(error);
    if (prismaError) {
      res.status(prismaError.status).json({ error: prismaError.message });
      return;
    }
    const apiError = asApiError(error, ApiErrors.taxonomyInvalid);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function deleteTaxonomyHandler(req: Request, res: Response) {
  const id = String(req.params.id || "");
  try {
    await deleteTaxonomy(id);
    res.status(200).json({ status: "deleted" });
  } catch (error) {
    const prismaError = mapTaxonomyError(error);
    if (prismaError) {
      res.status(prismaError.status).json({ error: prismaError.message });
      return;
    }
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}
