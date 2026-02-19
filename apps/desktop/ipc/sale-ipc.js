const { randomUUID } = require("crypto");
const { evaluateAlertsForProduct } = require("./inventory-alerts-logic");

function registerSaleIpc(
  ipcMain,
  {
    saleRepo,
    shiftRepo,
    inventoryRepo,
    productRepo,
    storeCreditRepo,
    productAlertRepo,
    inventoryAlertRepo,
    db,
    posSyncRepo,
    terminalAuthService,
    enqueueSaleSyncEvent,
    flushSalesJournal
  }
) {
  ipcMain.handle("sales:getAll", () => {
    return saleRepo.list();
  });

  ipcMain.handle("sales:create", (_event, sale) => {
    const active = shiftRepo.getActive();
    if (!active) {
      throw new Error("No active shift.");
    }
    if (sale.shiftId !== active.id) {
      throw new Error("Shift mismatch.");
    }
    if (sale.paymentMethod === "CREDITO_TIENDA") {
      if (!sale.customerId) {
        throw new Error("Customer required for store credit.");
      }
      const balance = storeCreditRepo.getBalance(sale.customerId);
      if (balance.amount < sale.total.amount) {
        throw new Error("Insufficient store credit.");
      }
    }

    const transaction = db.transaction(() => {
      saleRepo.create(sale);

      sale.items.forEach((item) => {
        const product = productRepo.getById(item.productId);
        if (!product || !product.isStockTracked) {
          return;
        }
        const row = inventoryRepo.getByProductId(item.productId);
        const current = row ? row.stock : 0;
        const next = current - item.quantity;
        if (next < 0) {
          throw new Error("Inventory cannot be negative.");
        }
        const nowIso = new Date().toISOString();
        inventoryRepo.setStock(item.productId, next, nowIso);
        const settings = productAlertRepo.getSettings(item.productId);
        evaluateAlertsForProduct({
          productId: item.productId,
          currentStock: next,
          settings,
          alertRepo: inventoryAlertRepo,
          nowIso
        });
      });

      if (sale.paymentMethod === "CREDITO_TIENDA" && sale.customerId) {
        storeCreditRepo.addMovement({
          id: randomUUID(),
          customerId: sale.customerId,
          amount: { amount: -sale.total.amount, currency: "MXN" },
          reason: "VENTA",
          referenceType: "SALE",
          referenceId: sale.id,
          createdAt: new Date().toISOString()
        });
      }

      if (posSyncRepo && enqueueSaleSyncEvent) {
        const terminalState = terminalAuthService?.getState?.() || null;
        enqueueSaleSyncEvent({
          posSyncRepo,
          terminalState,
          sale
        });
      }
    });

    transaction();
    shiftRepo.incrementExpectedAmount(active.id, sale.total.amount);
    if (flushSalesJournal) {
      flushSalesJournal().catch(() => {
        // Background sync is best effort and non-blocking.
      });
    }
  });
}

module.exports = { registerSaleIpc };
