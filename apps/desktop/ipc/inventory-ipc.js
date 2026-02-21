const { randomUUID } = require("crypto");
const { evaluateAlertsForProduct } = require("./inventory-alerts-logic");

function isNetworkError(error) {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("etimedout")
  );
}

function registerInventoryIpc(ipcMain, repo, productAlertRepo, inventoryAlertRepo, options = {}) {
  const authorize = typeof options.authorize === "function" ? options.authorize : null;
  const createCloudClient =
    typeof options.createCloudClient === "function" ? options.createCloudClient : null;
  const posSyncRepo = options.posSyncRepo ?? null;
  const terminalAuthService = options.terminalAuthService ?? null;

  const updateLocalStock = (productId, quantity) => {
    const next = Math.max(0, Math.trunc(Number(quantity) || 0));
    const nowIso = new Date().toISOString();
    repo.setStock(productId, next, nowIso);
    const settings = productAlertRepo.getSettings(productId);
    evaluateAlertsForProduct({
      productId,
      currentStock: next,
      settings,
      alertRepo: inventoryAlertRepo,
      nowIso
    });
  };

  const enqueueInventoryMovement = ({ productId, delta, reason, endpoint }) => {
    if (!posSyncRepo || !terminalAuthService) {
      return false;
    }

    const terminalState = terminalAuthService.getState();
    const nowIso = new Date().toISOString();
    posSyncRepo.enqueueSyncEvent({
      id: randomUUID(),
      terminalId: terminalState?.terminalId || null,
      branchId: terminalState?.branchId || null,
      eventType: "INVENTORY_MANUAL_ADJUST",
      payload: {
        productId,
        delta,
        reason,
        endpoint,
        idempotencyKey: randomUUID()
      },
      nowIso,
      maxRetries: 20,
      nextRetryAt: new Date(Date.now() + 30 * 60_000).toISOString()
    });

    return true;
  };

  const runManualAdjustment = async ({ productId, delta, reason }) => {
    if (!productId || !Number.isInteger(delta) || delta === 0) {
      const error = new Error("INVENTORY_INVALID");
      error.code = "INVENTORY_INVALID";
      throw error;
    }

    if (authorize) {
      const action = delta < 0 ? "inventory:decrement" : "inventory:increment";
      authorize(action);
    }

    const endpoint = delta < 0 ? "ADMIN" : "TERMINAL";
    const finalReason = reason || (delta > 0 ? "manual_increment" : "manual_decrement");
    const idempotencyKey = randomUUID();

    try {
      const cloudClient = createCloudClient ? createCloudClient() : null;
      if (!cloudClient) {
        const unavailable = new Error("POS_SYNC_STORAGE_FAILED");
        unavailable.code = "POS_SYNC_STORAGE_FAILED";
        throw unavailable;
      }

      let response;
      if (endpoint === "ADMIN") {
        const session = terminalAuthService?.getUserSessionState?.();
        const posUserToken = terminalAuthService?.getUserAccessToken?.();
        if (!session?.authenticated || session.user?.role !== "ADMIN" || !posUserToken) {
          const authError = new Error("AUTH_SESSION_EXPIRED");
          authError.code = "AUTH_SESSION_EXPIRED";
          throw authError;
        }

        response = await cloudClient.sendAdminInventoryMovement({
          productId,
          delta,
          reason: finalReason,
          idempotencyKey,
          posUserToken
        });
      } else {
        response = await cloudClient.sendInventoryMovement({
          productId,
          delta,
          reason: finalReason,
          idempotencyKey
        });
      }

      const nextQuantity = Number(response?.item?.available ?? response?.adjustment?.newQuantity);
      if (Number.isFinite(nextQuantity)) {
        updateLocalStock(productId, nextQuantity);
      }

      return {
        ok: true,
        queued: false,
        state: repo.loadState(),
        adjustment: response?.adjustment || null,
        item: response?.item || null
      };
    } catch (error) {
      const code = error?.code || "INVENTORY_STOCK_WRITE_FAILED";
      const canQueue =
        isNetworkError(error) ||
        code === "POS_SYNC_STORAGE_FAILED" ||
        code === "POS_SYNC_RATE_LIMITED";

      if (canQueue) {
        const queued = enqueueInventoryMovement({
          productId,
          delta,
          reason: finalReason,
          endpoint
        });

        if (queued) {
          return {
            ok: true,
            queued: true,
            state: repo.loadState(),
            adjustment: null,
            item: null
          };
        }
      }

      throw error;
    }
  };

  ipcMain.handle("inventory:get", () => repo.loadState());

  ipcMain.handle("inventory:adjustManual", async (_event, payload) => {
    const productId = String(payload?.productId || "").trim();
    const delta = Number(payload?.delta);
    const reason = String(payload?.reason || "").trim();
    return runManualAdjustment({ productId, delta, reason });
  });

  // Backward-compatible alias used by existing renderer flows.
  ipcMain.handle("inventory:updateStock", async (_event, productId, delta, reason) => {
    const response = await runManualAdjustment({
      productId: String(productId || "").trim(),
      delta: Number(delta),
      reason: String(reason || "").trim()
    });

    return response.state;
  });
}

module.exports = { registerInventoryIpc };
