const { evaluateAlertsForProduct } = require("./inventory-alerts-logic");

function registerInventoryAlertsIpc(
  ipcMain,
  { productAlertRepo, inventoryAlertRepo, inventoryRepo }
) {
  ipcMain.handle("inventory-alerts:getActive", (_event, filters) => {
    return inventoryAlertRepo.getActiveAlerts(filters?.type);
  });

  ipcMain.handle("inventory-alerts:getByProduct", (_event, productId) => {
    return inventoryAlertRepo.getAlertsByProduct(productId);
  });

  ipcMain.handle("inventory-alerts:getSettings", (_event, productId) => {
    return productAlertRepo.getSettings(productId);
  });

  ipcMain.handle("inventory-alerts:updateSettings", (_event, productId, settings) => {
    if (!Number.isInteger(settings.minStock) || settings.minStock < 0) {
      throw new Error("Invalid min stock.");
    }
    const updatedAt = new Date().toISOString();
    const payload = {
      productId,
      minStock: settings.minStock,
      alertsEnabled: settings.alertsEnabled,
      outOfStockEnabled: settings.outOfStockEnabled,
      updatedAt
    };
    const updated = productAlertRepo.updateSettings(payload);
    const row = inventoryRepo.getByProductId(productId);
    const currentStock = row ? row.stock : 0;
    evaluateAlertsForProduct({
      productId,
      currentStock,
      settings: updated,
      alertRepo: inventoryAlertRepo,
      nowIso: updatedAt
    });
    return updated;
  });
}

module.exports = { registerInventoryAlertsIpc };
