import { Router } from "express";

import { getCatalogFiltersHandler } from "../controllers/catalog-controller";
import authRoutes from "./auth";

const router = Router();

router.get("/api/cloud/catalog/filters", getCatalogFiltersHandler);
router.use(authRoutes);

export default router;
