import type { Request, Response } from "express";

import { ApiErrors, asApiError } from "../../errors/api-error";
import type { CatalogUseCases } from "../../application/use-cases/catalog";

export function createCatalogController(useCases: CatalogUseCases) {
  return {
    async getCatalogFiltersHandler(_req: Request, res: Response) {
      try {
        const result = await useCases.getCatalogFilters();
        res.setHeader("Cache-Control", "public, max-age=60");
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },
    async getFeaturedCatalogHandler(_req: Request, res: Response) {
      try {
        const result = await useCases.getFeaturedCatalog();
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    }
  };
}
