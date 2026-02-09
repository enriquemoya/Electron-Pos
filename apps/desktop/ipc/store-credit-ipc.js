const { randomUUID } = require("crypto");

function registerStoreCreditIpc(ipcMain, repo) {
  ipcMain.handle("store-credit:grant", (_event, payload) => {
    if (!payload?.customerId || !payload?.amount || payload.amount <= 0) {
      throw new Error("Invalid credit amount.");
    }
    const movement = {
      id: randomUUID(),
      customerId: payload.customerId,
      amount: { amount: payload.amount, currency: "MXN" },
      reason: payload.reason,
      referenceType: payload.referenceType,
      referenceId: payload.referenceId ?? null,
      createdAt: new Date().toISOString()
    };
    return repo.addMovement(movement);
  });

  ipcMain.handle("store-credit:balance", (_event, customerId) => {
    return repo.getBalance(customerId);
  });

  ipcMain.handle("store-credit:movements", (_event, customerId) => {
    return repo.listMovements(customerId);
  });
}

module.exports = { registerStoreCreditIpc };
