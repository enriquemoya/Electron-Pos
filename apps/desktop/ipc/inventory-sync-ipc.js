function registerInventorySyncIpc(
  ipcMain,
  {
    inventorySyncRepo,
    posSyncRepo,
    inventoryRepo,
    terminalAuthService,
    createCloudClient,
    runCatalogSync,
    runReconcile,
    flushSalesJournal,
    flushInventoryAdjustmentJournal,
    catalogProjectionService
  }
) {
  ipcMain.handle("inventory-sync:getStatus", () => {
    const legacy = inventorySyncRepo.getState("pos-local");
    const syncState = posSyncRepo.getState();
    const queueStats = posSyncRepo.getJournalStats();
    return {
      legacy,
      syncState,
      queue: queueStats,
      terminal: terminalAuthService.getState()
    };
  });

  ipcMain.handle("inventory-sync:run", async () => {
    const cloudClient = createCloudClient();
    if (!cloudClient) {
      throw new Error("CLOUD_SYNC_UNAVAILABLE");
    }

    const catalog = await runCatalogSync({
      cloudClient,
      posSyncRepo,
      catalogProjectionService
    });

    const queue = await flushSalesJournal({
      cloudClient,
      posSyncRepo
    });
    const inventoryQueue = await flushInventoryAdjustmentJournal({
      cloudClient,
      posSyncRepo,
      inventoryRepo,
      terminalAuthService
    });

    return {
      catalog,
      queue,
      inventoryQueue,
      state: posSyncRepo.getState(),
      journal: posSyncRepo.getJournalStats()
    };
  });

  ipcMain.handle("inventory-sync:reconcile", async () => {
    const cloudClient = createCloudClient();
    if (!cloudClient) {
      throw new Error("CLOUD_SYNC_UNAVAILABLE");
    }

    const plan = await runReconcile({
      cloudClient,
      posSyncRepo,
      catalogProjectionService
    });

    return {
      plan,
      state: posSyncRepo.getState()
    };
  });
}

module.exports = {
  registerInventorySyncIpc
};
