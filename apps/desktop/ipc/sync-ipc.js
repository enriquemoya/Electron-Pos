function registerSyncIpc(ipcMain, repo) {
  ipcMain.handle("sync:get", (_event, provider) => {
    return repo.get(provider);
  });

  ipcMain.handle("sync:update", (_event, provider, state) => {
    repo.set(provider, state);
  });
}

module.exports = { registerSyncIpc };
