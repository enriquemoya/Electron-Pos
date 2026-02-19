function registerInventorySyncIpc(
  ipcMain,
  {
    inventorySyncRepo,
    posSyncRepo,
    terminalAuthService,
    createCloudClient,
    runCatalogSync,
    runReconcile,
    flushSalesJournal
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
      posSyncRepo
    });

    const queue = await flushSalesJournal({
      cloudClient,
      posSyncRepo
    });

    return {
      catalog,
      queue,
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
      posSyncRepo
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
