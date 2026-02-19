import { Router } from "express";

import type { AuthUseCases } from "../../application/use-cases/auth";
import type { BranchUseCases } from "../../application/use-cases/branches";
import type { CatalogUseCases } from "../../application/use-cases/catalog";
import type { BlogUseCases } from "../../application/use-cases/blog";
import { createBranchesController } from "../controllers/branches-controller";
import { createCatalogController } from "../controllers/catalog-controller";
import { createAuthRoutes } from "./auth";
import { createBlogController } from "../controllers/blog-controller";

export function createPublicRoutes(params: {
  catalogUseCases: CatalogUseCases;
  authUseCases: AuthUseCases;
  branchUseCases: BranchUseCases;
  blogUseCases: BlogUseCases;
}) {
  const router = Router();
  const catalogController = createCatalogController(params.catalogUseCases);
  const branchesController = createBranchesController(params.branchUseCases);
  const blogController = createBlogController(params.blogUseCases);

  router.get("/api/cloud/catalog/filters", catalogController.getCatalogFiltersHandler);
  router.get("/catalog/taxonomies/games", catalogController.listGamesHandler);
  router.get("/catalog/taxonomies/categories", catalogController.listCategoriesHandler);
  router.get("/catalog/taxonomies/expansions", catalogController.listExpansionsHandler);
  router.get("/branches", branchesController.listBranchesHandler);
  router.get("/blog/posts", blogController.listPublicPostsHandler);
  router.get("/blog/posts/:slug", blogController.getPublicPostBySlugHandler);
  router.get("/blog/rss", blogController.rssHandler);
  router.get("/blog/sitemap", blogController.sitemapHandler);
  router.use(createAuthRoutes(params.authUseCases));

  return router;
}

export default createPublicRoutes;
