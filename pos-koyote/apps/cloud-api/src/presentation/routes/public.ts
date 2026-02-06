import { Router } from "express";

import type { AuthUseCases } from "../../application/use-cases/auth";
import type { CatalogUseCases } from "../../application/use-cases/catalog";
import { createCatalogController } from "../controllers/catalog-controller";
import { createAuthRoutes } from "./auth";

export function createPublicRoutes(params: { catalogUseCases: CatalogUseCases; authUseCases: AuthUseCases }) {
  const router = Router();
  const catalogController = createCatalogController(params.catalogUseCases);

  router.get("/api/cloud/catalog/filters", catalogController.getCatalogFiltersHandler);
  router.use(createAuthRoutes(params.authUseCases));

  return router;
}

export default createPublicRoutes;
