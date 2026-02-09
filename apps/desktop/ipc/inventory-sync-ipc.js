function registerInventorySyncIpc(ipcMain, syncRepo) {
  ipcMain.handle("inventory-sync:getStatus", (_event, posId) => {
    if (!posId) {
      throw new Error("posId is required.");
    }
    return syncRepo.getState(posId);
  });
}

module.exports = {
  registerInventorySyncIpc
};
