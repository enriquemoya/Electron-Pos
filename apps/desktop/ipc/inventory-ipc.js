const { evaluateAlertsForProduct } = require("./inventory-alerts-logic");

function registerInventoryIpc(ipcMain, repo, productAlertRepo, inventoryAlertRepo) {
  ipcMain.handle("inventory:get", () => {
    return repo.loadState();
  });

  ipcMain.handle("inventory:updateStock", (_event, productId, delta) => {
    const row = repo.getByProductId(productId);
    const current = row ? row.stock : 0;
    const next = current + delta;
    if (next < 0) {
      throw new Error("Inventory cannot be negative.");
    }
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
    return repo.loadState();
  });
}

module.exports = { registerInventoryIpc };
