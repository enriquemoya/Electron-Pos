function registerDataSafetyIpc(ipcMain, dataSafety) {
  ipcMain.handle("data-safety:getBackupStatus", () => dataSafety.getBackupStatus());
  ipcMain.handle("data-safety:listBackups", () => dataSafety.listBackups());
  ipcMain.handle("data-safety:createBackup", () => dataSafety.createBackupNow());
  ipcMain.handle("data-safety:getDbHealth", () => dataSafety.getDbHealth());
  ipcMain.handle("data-safety:restore", async (_event, payload) => {
    if (!dataSafety.isRecoveryMode()) {
      throw new Error("Restore is only allowed in recovery mode.");
    }
    if (!payload || payload.confirm !== true || !payload.filename) {
      throw new Error("Restore confirmation required.");
    }
    return dataSafety.restoreBackup(payload.filename);
  });
  ipcMain.handle("data-safety:restart", () => dataSafety.restartApp());
}

module.exports = {
  registerDataSafetyIpc
};
