function registerCustomerIpc(ipcMain, repo) {
  ipcMain.handle("customers:create", (_event, customer) => {
    return repo.create(customer);
  });

  ipcMain.handle("customers:update", (_event, customer) => {
    return repo.update(customer);
  });

  ipcMain.handle("customers:search", (_event, query) => {
    return repo.search(query ?? "");
  });

  ipcMain.handle("customers:listPaged", (_event, filters) => {
    return repo.listPaged(filters ?? {});
  });

  ipcMain.handle("customers:get", (_event, customerId) => {
    return repo.getById(customerId);
  });
}

module.exports = { registerCustomerIpc };
