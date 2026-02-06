import type { Request, Response } from "express";

import { ApiErrors, asApiError } from "../errors/api-error";
import { getCatalogFilters, getFeaturedCatalog } from "../services/catalog-service";

export async function getCatalogFiltersHandler(_req: Request, res: Response) {
  try {
    const result = await getCatalogFilters();
    res.setHeader("Cache-Control", "public, max-age=60");
    res.status(200).json(result);
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function getFeaturedCatalogHandler(_req: Request, res: Response) {
  try {
    const result = await getFeaturedCatalog();
    res.status(200).json(result);
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}
