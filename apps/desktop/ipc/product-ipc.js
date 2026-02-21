function registerProductIpc(ipcMain, repo, expansionRepo, options = {}) {
  const authorize = typeof options.authorize === "function" ? options.authorize : null;
  const assertCatalogReadOnly = () => {
    const error = new Error("Catalog is cloud-managed and read-only in POS.");
    error.code = "CATALOG_READ_ONLY";
    throw error;
  };
  // Products CRUD is explicit and synchronous in the main process.
  ipcMain.handle("products:getAll", () => {
    return repo.list();
  });

  ipcMain.handle("products:getTop", (_event, limit) => {
    return repo.listTop(limit ?? 5);
  });

  ipcMain.handle("products:getRecent", (_event, limit) => {
    return repo.listRecent(limit ?? 5);
  });

  ipcMain.handle("products:listPaged", (_event, filters) => {
    return repo.listPaged(filters ?? {});
  });

  ipcMain.handle("products:create", (_event, product) => {
    authorize?.("catalog:write");
    assertCatalogReadOnly();
  });

  ipcMain.handle("products:update", (_event, product) => {
    authorize?.("catalog:write");
    assertCatalogReadOnly();
  });
}

module.exports = { registerProductIpc };
