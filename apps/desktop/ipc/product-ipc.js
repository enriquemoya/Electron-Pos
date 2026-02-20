function registerProductIpc(ipcMain, repo, expansionRepo, options = {}) {
  const authorize = typeof options.authorize === "function" ? options.authorize : null;
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
    if (product?.expansionId && !product?.gameTypeId) {
      throw new Error("Expansion requires game type.");
    }
    if (product?.expansionId && product?.gameTypeId) {
      const expansion = expansionRepo.getById(product.expansionId);
      if (!expansion) {
        throw new Error("Expansion not found.");
      }
      if (expansion.gameTypeId !== product.gameTypeId) {
        throw new Error("Expansion mismatch.");
      }
    }
    repo.create(product);
  });

  ipcMain.handle("products:update", (_event, product) => {
    authorize?.("catalog:write");
    if (product?.expansionId && !product?.gameTypeId) {
      throw new Error("Expansion requires game type.");
    }
    if (product?.expansionId && product?.gameTypeId) {
      const expansion = expansionRepo.getById(product.expansionId);
      if (!expansion) {
        throw new Error("Expansion not found.");
      }
      if (expansion.gameTypeId !== product.gameTypeId) {
        throw new Error("Expansion mismatch.");
      }
    }
    repo.update(product);
  });
}

module.exports = { registerProductIpc };
