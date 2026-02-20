function registerExpansionIpc(ipcMain, expansionRepo, options = {}) {
  const authorize = typeof options.authorize === "function" ? options.authorize : null;
  const assertCatalogReadOnly = () => {
    const error = new Error("Catalog is cloud-managed and read-only in POS.");
    error.code = "CATALOG_READ_ONLY";
    throw error;
  };
  ipcMain.handle("expansions:listByGame", (_event, gameTypeId, includeInactive) => {
    if (!gameTypeId) {
      throw new Error("Game type required.");
    }
    return expansionRepo.listByGameType(gameTypeId, Boolean(includeInactive));
  });

  ipcMain.handle("expansions:getById", (_event, expansionId) => {
    if (!expansionId) {
      return null;
    }
    return expansionRepo.getById(expansionId);
  });

  ipcMain.handle("expansions:create", (_event, payload) => {
    authorize?.("catalog:write");
    assertCatalogReadOnly();
  });

  ipcMain.handle("expansions:update", (_event, payload) => {
    authorize?.("catalog:write");
    assertCatalogReadOnly();
  });

  ipcMain.handle("expansions:deactivate", (_event, expansionId) => {
    authorize?.("catalog:write");
    assertCatalogReadOnly();
  });

  ipcMain.handle("expansions:delete", (_event, expansionId) => {
    authorize?.("catalog:write");
    assertCatalogReadOnly();
  });
}

module.exports = { registerExpansionIpc };
