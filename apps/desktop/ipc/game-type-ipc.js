function registerGameTypeIpc(ipcMain, repo, options = {}) {
  const authorize = typeof options.authorize === "function" ? options.authorize : null;
  const assertCatalogReadOnly = () => {
    const error = new Error("Catalog is cloud-managed and read-only in POS.");
    error.code = "CATALOG_READ_ONLY";
    throw error;
  };
  ipcMain.handle("game-types:list", (_event, activeOnly = false) => {
    return repo.list(Boolean(activeOnly));
  });

  ipcMain.handle("game-types:create", (_event, payload) => {
    authorize?.("catalog:write");
    assertCatalogReadOnly();
  });

  ipcMain.handle("game-types:update", (_event, payload) => {
    authorize?.("catalog:write");
    assertCatalogReadOnly();
  });
}

module.exports = { registerGameTypeIpc };
