import { Router } from "express";

import type { AdminDashboardUseCases } from "../../application/use-cases/admin-dashboard";
import type { CatalogAdminUseCases } from "../../application/use-cases/catalog-admin";
import type { CatalogUseCases } from "../../application/use-cases/catalog";
import type { CheckoutUseCases } from "../../application/use-cases/checkout";
import type { InventoryUseCases } from "../../application/use-cases/inventory";
import type { OrderFulfillmentUseCases } from "../../application/use-cases/order-fulfillment";
import type { ProfileUseCases } from "../../application/use-cases/profile";
import type { SyncUseCases } from "../../application/use-cases/sync";
import type { UsersUseCases } from "../../application/use-cases/users";
import type { BranchUseCases } from "../../application/use-cases/branches";
import type { MediaUseCases } from "../../application/use-cases/media";
import type { BlogUseCases } from "../../application/use-cases/blog";
import type { TerminalUseCases } from "../../application/use-cases/terminals";
import type { PosAuthUseCases } from "../../application/use-cases/pos-auth";
import { createCatalogController } from "../controllers/catalog-controller";
import { createAdminDashboardController } from "../controllers/admin-dashboard-controller";
import { createCatalogAdminController } from "../controllers/catalog-admin-controller";
import { createInventoryController } from "../controllers/inventory-controller";
import { createSyncController } from "../controllers/sync-controller";
import { createProfileController } from "../controllers/profile-controller";
import { requireAuth } from "../middleware/require-auth";
import { requireRoles } from "../middleware/require-rbac";
import { createUsersController } from "../controllers/users-controller";
import { createCheckoutController } from "../controllers/checkout-controller";
import { createBranchesController } from "../controllers/branches-controller";
import { createOrderFulfillmentController } from "../controllers/order-fulfillment-controller";
import { createMediaController } from "../controllers/media-controller";
import { adminMediaUploadMiddleware } from "../middleware/admin-media-upload";
import { createBlogController } from "../controllers/blog-controller";
import { createRateLimitMiddleware } from "../middleware/rate-limit";
import { ApiErrors } from "../../errors/api-error";
import { createTerminalController } from "../controllers/terminal-controller";
import { requireTerminalAuth } from "../middleware/require-terminal-auth";
import { posProofUploadMiddleware } from "../middleware/pos-proof-upload";
import { createPosAuthController } from "../controllers/pos-auth-controller";
import { requirePosAdminSession } from "../middleware/require-pos-user-session";

export function createProtectedRoutes(params: {
  adminDashboardUseCases: AdminDashboardUseCases;
  catalogUseCases: CatalogUseCases;
  catalogAdminUseCases: CatalogAdminUseCases;
  inventoryUseCases: InventoryUseCases;
  syncUseCases: SyncUseCases;
  profileUseCases: ProfileUseCases;
  usersUseCases: UsersUseCases;
  checkoutUseCases: CheckoutUseCases;
  branchUseCases: BranchUseCases;
  orderFulfillmentUseCases: OrderFulfillmentUseCases;
  mediaUseCases: MediaUseCases;
  blogUseCases: BlogUseCases;
  terminalUseCases: TerminalUseCases;
  posAuthUseCases: PosAuthUseCases;
}) {
  const router = Router();
  const catalogController = createCatalogController(params.catalogUseCases);
  const adminDashboardController = createAdminDashboardController(params.adminDashboardUseCases);
  const catalogAdminController = createCatalogAdminController(params.catalogAdminUseCases);
  const inventoryController = createInventoryController(params.inventoryUseCases);
  const syncController = createSyncController(params.syncUseCases);
  const profileController = createProfileController(params.profileUseCases);
  const usersController = createUsersController(params.usersUseCases);
  const checkoutController = createCheckoutController(params.checkoutUseCases);
  const branchesController = createBranchesController(params.branchUseCases);
  const orderFulfillmentController = createOrderFulfillmentController(params.orderFulfillmentUseCases);
  const mediaController = createMediaController(params.mediaUseCases);
  const blogController = createBlogController(params.blogUseCases);
  const terminalController = createTerminalController(params.terminalUseCases);
  const posAuthController = createPosAuthController(params.posAuthUseCases);
  const blogMutationsRateLimit = createRateLimitMiddleware({
    limit: 30,
    windowMs: 60_000,
    keyPrefix: "admin-blog-mutations"
  });
  const mediaWriteRateLimit = createRateLimitMiddleware({
    limit: 30,
    windowMs: 60_000,
    keyPrefix: "admin-media-write",
    error: ApiErrors.mediaRateLimited
  });
  const mediaReadRateLimit = createRateLimitMiddleware({
    limit: 60,
    windowMs: 60_000,
    keyPrefix: "admin-media-read",
    error: ApiErrors.mediaRateLimited
  });
  const terminalActivationRateLimit = createRateLimitMiddleware({
    limit: 10,
    windowMs: 60_000,
    keyPrefix: "pos-activation",
    error: ApiErrors.terminalRateLimited
  });
  const terminalRotationRateLimit = createRateLimitMiddleware({
    limit: 60,
    windowMs: 60_000,
    keyPrefix: "pos-rotation",
    error: ApiErrors.terminalRateLimited
  });
  const terminalSyncRateLimit = createRateLimitMiddleware({
    limit: 120,
    windowMs: 60_000,
    keyPrefix: "pos-sync",
    error: ApiErrors.posSyncRateLimited
  });
  const posProofUploadRateLimit = createRateLimitMiddleware({
    limit: 30,
    windowMs: 60_000,
    keyPrefix: "pos-proof-upload",
    error: ApiErrors.proofRateLimited
  });
  const adminProofReadRateLimit = createRateLimitMiddleware({
    limit: 60,
    windowMs: 60_000,
    keyPrefix: "admin-proof-read",
    error: ApiErrors.proofRateLimited
  });
  const requirePosToken = requireTerminalAuth(params.terminalUseCases);

  router.post("/sync/events", syncController.recordEventsHandler);
  router.get("/sync/pending", syncController.getPendingHandler);
  router.post("/sync/ack", syncController.acknowledgeHandler);
  router.get("/pos/catalog/snapshot", terminalSyncRateLimit, requirePosToken, syncController.catalogSnapshotHandler);
  router.get("/pos/catalog/delta", terminalSyncRateLimit, requirePosToken, syncController.catalogDeltaHandler);
  router.post("/pos/catalog/reconcile", terminalSyncRateLimit, requirePosToken, syncController.reconcileCatalogHandler);
  router.post("/pos/sync/sales-events", terminalSyncRateLimit, requirePosToken, syncController.ingestSalesEventHandler);
  router.post("/pos/inventory/movements", terminalSyncRateLimit, requirePosToken, inventoryController.createPosMovementHandler);
  router.post(
    "/pos/inventory/admin-movements",
    terminalSyncRateLimit,
    requirePosToken,
    requirePosAdminSession,
    inventoryController.createPosAdminMovementHandler
  );
  router.post("/pos/media/proofs/upload", posProofUploadRateLimit, requirePosToken, posProofUploadMiddleware, mediaController.uploadPosProofHandler);
  router.post("/pos/auth/pin-login", terminalSyncRateLimit, requirePosToken, posAuthController.loginWithPinHandler);
  router.post("/orders", terminalSyncRateLimit, requirePosToken, syncController.createOrderHandler);
  router.get("/read/products", syncController.readProductsHandler);
  router.post("/pos/activate", terminalActivationRateLimit, terminalController.activateHandler);
  router.post("/pos/rotate-token", terminalRotationRateLimit, requirePosToken, terminalController.rotateTokenHandler);
  router.get("/api/cloud/catalog/featured", catalogController.getFeaturedCatalogHandler);

  router.use("/profile", requireAuth);
  router.get("/profile/me", profileController.getProfileHandler);
  router.patch("/profile/me", profileController.updateProfileHandler);
  router.patch("/profile/password", profileController.updatePasswordHandler);
  router.patch("/profile/pin", profileController.updatePinHandler);

  router.use("/checkout", requireAuth);
  router.post("/checkout/drafts", checkoutController.createDraftHandler);
  router.get("/checkout/drafts/active", checkoutController.getActiveDraftHandler);
  router.post("/checkout/revalidate", checkoutController.revalidateHandler);
  router.post("/checkout/orders", checkoutController.createOrderHandler);
  router.get("/checkout/orders/:orderId", checkoutController.getOrderHandler);

  router.use("/orders", requireAuth);
  router.get("/orders", orderFulfillmentController.listCustomerOrdersHandler);
  router.get("/orders/:orderId", orderFulfillmentController.getCustomerOrderHandler);

  const requireAdminRole = requireRoles(["ADMIN"]);
  const requireAdminOrEmployeeRole = requireRoles(["ADMIN", "EMPLOYEE"]);

  router.use("/admin", requireAuth);
  router.get("/admin/dashboard/summary", requireAdminRole, adminDashboardController.getAdminSummaryHandler);
  router.get("/admin/inventory", requireAdminRole, inventoryController.listInventoryHandler);
  router.get("/admin/inventory/stock", requireAdminRole, inventoryController.listInventoryStockHandler);
  router.get("/admin/inventory/stock/:productId", requireAdminRole, inventoryController.getInventoryStockDetailHandler);
  router.get("/admin/inventory/movements", requireAdminRole, inventoryController.listInventoryMovementsHandler);
  router.post("/admin/inventory/movements", requireAdminRole, inventoryController.createAdminMovementHandler);
  router.post("/admin/inventory/:productId/adjust", requireAdminRole, inventoryController.adjustInventoryHandler);
  router.get("/admin/catalog/products", requireAdminRole, catalogAdminController.listCatalogProductsHandler);
  router.get("/admin/catalog/products/:productId", requireAdminRole, catalogAdminController.getCatalogProductHandler);
  router.post("/admin/catalog/products", requireAdminRole, catalogAdminController.createCatalogProductHandler);
  router.patch("/admin/catalog/products/:productId", requireAdminRole, catalogAdminController.updateCatalogProductHandler);
  router.get("/admin/catalog/taxonomies", requireAdminRole, catalogAdminController.listTaxonomiesHandler);
  router.post("/admin/catalog/taxonomies", requireAdminRole, catalogAdminController.createTaxonomyHandler);
  router.patch("/admin/catalog/taxonomies/:id", requireAdminRole, catalogAdminController.updateTaxonomyHandler);
  router.delete("/admin/catalog/taxonomies/:id", requireAdminRole, catalogAdminController.deleteTaxonomyHandler);
  router.get("/admin/branches", requireAdminRole, branchesController.listBranchesHandler);
  router.post("/admin/branches", requireAdminRole, branchesController.createBranchHandler);
  router.patch("/admin/branches/:id", requireAdminRole, branchesController.updateBranchHandler);
  router.delete("/admin/branches/:id", requireAdminRole, branchesController.deleteBranchHandler);
  router.get("/admin/orders", requireAdminOrEmployeeRole, orderFulfillmentController.listAdminOrdersHandler);
  router.get("/admin/orders/:orderId", requireAdminOrEmployeeRole, orderFulfillmentController.getAdminOrderHandler);
  router.post("/admin/orders/:orderId/status", requireAdminOrEmployeeRole, orderFulfillmentController.transitionOrderStatusHandler);
  router.post("/admin/orders/:orderId/refunds", requireAdminRole, orderFulfillmentController.createRefundHandler);
  router.post("/admin/orders/expire", requireAdminRole, orderFulfillmentController.runExpirationSweepHandler);
  router.get("/admin/media", requireAdminRole, mediaReadRateLimit, mediaController.listAdminMediaHandler);
  router.get("/admin/media/proofs", requireAdminRole, adminProofReadRateLimit, mediaController.listAdminProofsHandler);
  router.get("/admin/media/proofs/:id", requireAdminRole, adminProofReadRateLimit, mediaController.getAdminProofByIdHandler);
  router.post("/admin/media/upload", requireAdminRole, mediaWriteRateLimit, adminMediaUploadMiddleware, mediaController.uploadAdminMediaHandler);
  router.delete("/admin/media/*", requireAdminRole, mediaWriteRateLimit, mediaController.deleteAdminMediaHandler);
  router.get("/admin/blog/posts", requireAdminRole, blogController.listAdminPostsHandler);
  router.get("/admin/blog/posts/:id", requireAdminRole, blogController.getAdminPostHandler);
  router.post("/admin/blog/posts", requireAdminRole, blogMutationsRateLimit, blogController.createPostHandler);
  router.patch("/admin/blog/posts/:id", requireAdminRole, blogMutationsRateLimit, blogController.updatePostHandler);
  router.post("/admin/blog/posts/:id/publish", requireAdminRole, blogMutationsRateLimit, blogController.publishPostHandler);
  router.post("/admin/blog/posts/:id/unpublish", requireAdminRole, blogMutationsRateLimit, blogController.unpublishPostHandler);
  router.delete("/admin/blog/posts/:id", requireAdminRole, blogMutationsRateLimit, blogController.deletePostHandler);
  router.get("/admin/terminals", requireAdminRole, terminalController.listAdminTerminalsHandler);
  router.post("/admin/terminals", requireAdminRole, terminalController.createAdminTerminalHandler);
  router.post("/admin/terminals/:id/regenerate-key", requireAdminRole, terminalController.regenerateAdminTerminalKeyHandler);
  router.post("/admin/terminals/:id/revoke", requireAdminRole, terminalController.revokeAdminTerminalHandler);
  router.get("/admin/users", requireAdminRole, usersController.listUsersHandler);
  router.get("/admin/users/:id", requireAdminRole, usersController.getUserHandler);
  router.post("/admin/users", requireAdminRole, usersController.createUserHandler);
  router.patch("/admin/users/:id", requireAdminRole, usersController.updateUserHandler);
  router.delete("/admin/users/:id", requireAdminRole, usersController.deleteUserHandler);
  router.get("/admin/users/:id/addresses", requireAdminRole, usersController.listAddressesHandler);
  router.post("/admin/users/:id/addresses", requireAdminRole, usersController.createAddressHandler);
  router.patch("/admin/users/:id/addresses/:addressId", requireAdminRole, usersController.updateAddressHandler);
  router.delete("/admin/users/:id/addresses/:addressId", requireAdminRole, usersController.deleteAddressHandler);

  return router;
}

export default createProtectedRoutes;
