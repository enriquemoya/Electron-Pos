function registerCategoryIpc(ipcMain, repo) {
  ipcMain.handle("categories:list", (_event, activeOnly = true) => {
    return repo.list(activeOnly !== false);
  });
}

module.exports = { registerCategoryIpc };
