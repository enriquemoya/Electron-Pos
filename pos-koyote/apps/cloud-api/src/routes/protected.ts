import { Router } from "express";

import { getFeaturedCatalogHandler } from "../controllers/catalog-controller";
import { getAdminSummaryHandler } from "../controllers/admin-dashboard-controller";
import {
  createTaxonomyHandler,
  deleteTaxonomyHandler,
  getCatalogProductHandler,
  createCatalogProductHandler,
  listCatalogProductsHandler,
  listTaxonomiesHandler,
  updateCatalogProductHandler,
  updateTaxonomyHandler
} from "../controllers/catalog-admin-controller";
import { adjustInventoryHandler, listInventoryHandler } from "../controllers/inventory-controller";
import {
  acknowledgeHandler,
  createOrderHandler,
  getPendingHandler,
  readProductsHandler,
  recordEventsHandler
} from "../controllers/sync-controller";
import { requireAdmin } from "../middleware/require-admin";
import {
  createAddressHandler,
  createUserHandler,
  deleteAddressHandler,
  deleteUserHandler,
  getUserHandler,
  listAddressesHandler,
  listUsersHandler,
  updateAddressHandler,
  updateUserHandler
} from "../controllers/users-controller";

const router = Router();

router.post("/sync/events", recordEventsHandler);
router.get("/sync/pending", getPendingHandler);
router.post("/sync/ack", acknowledgeHandler);
router.post("/orders", createOrderHandler);
router.get("/read/products", readProductsHandler);
router.get("/api/cloud/catalog/featured", getFeaturedCatalogHandler);

router.use("/admin", requireAdmin);
router.get("/admin/dashboard/summary", getAdminSummaryHandler);
router.get("/admin/inventory", listInventoryHandler);
router.post("/admin/inventory/:productId/adjust", adjustInventoryHandler);
router.get("/admin/catalog/products", listCatalogProductsHandler);
router.get("/admin/catalog/products/:productId", getCatalogProductHandler);
router.post("/admin/catalog/products", createCatalogProductHandler);
router.patch("/admin/catalog/products/:productId", updateCatalogProductHandler);
router.get("/admin/catalog/taxonomies", listTaxonomiesHandler);
router.post("/admin/catalog/taxonomies", createTaxonomyHandler);
router.patch("/admin/catalog/taxonomies/:id", updateTaxonomyHandler);
router.delete("/admin/catalog/taxonomies/:id", deleteTaxonomyHandler);
router.get("/admin/users", listUsersHandler);
router.get("/admin/users/:id", getUserHandler);
router.post("/admin/users", createUserHandler);
router.patch("/admin/users/:id", updateUserHandler);
router.delete("/admin/users/:id", deleteUserHandler);
router.get("/admin/users/:id/addresses", listAddressesHandler);
router.post("/admin/users/:id/addresses", createAddressHandler);
router.patch("/admin/users/:id/addresses/:addressId", updateAddressHandler);
router.delete("/admin/users/:id/addresses/:addressId", deleteAddressHandler);

export default router;
