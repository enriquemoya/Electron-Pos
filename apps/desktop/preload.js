const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("koyote", {
  version: "0.0.0",
  terminalAuth: {
    getState: () => ipcRenderer.invoke("terminal-auth:get-state"),
    activate: (activationApiKey) =>
      ipcRenderer.invoke("terminal-auth:activate", { activationApiKey }),
    rotate: () => ipcRenderer.invoke("terminal-auth:rotate"),
    clear: () => ipcRenderer.invoke("terminal-auth:clear"),
    onStateChanged: (handler) => {
      const listener = (_event, state) => {
        handler(state);
      };
      ipcRenderer.on("terminal-auth:state-changed", listener);
      return () => ipcRenderer.removeListener("terminal-auth:state-changed", listener);
    }
  }
});

contextBridge.exposeInMainWorld("koyotePosUserAuth", {
  getSession: () => ipcRenderer.invoke("pos-user-auth:get-session"),
  loginWithPin: (pin) => ipcRenderer.invoke("pos-user-auth:login-pin", { pin }),
  logout: () => ipcRenderer.invoke("pos-user-auth:logout")
});

contextBridge.exposeInMainWorld("api", {
  products: {
    getProducts: () => ipcRenderer.invoke("products:getAll"),
    getTopProducts: (limit) => ipcRenderer.invoke("products:getTop", limit),
    getRecentProducts: (limit) => ipcRenderer.invoke("products:getRecent", limit),
    listPaged: (filters) => ipcRenderer.invoke("products:listPaged", filters),
    createProduct: (product) => ipcRenderer.invoke("products:create", product),
    updateProduct: (product) => ipcRenderer.invoke("products:update", product)
  },
  inventory: {
    getInventory: () => ipcRenderer.invoke("inventory:get"),
    updateStock: (productId, delta, reason) =>
      ipcRenderer.invoke("inventory:updateStock", productId, delta, reason),
    adjustManual: (payload) => ipcRenderer.invoke("inventory:adjustManual", payload)
  },
  inventoryAlerts: {
    getActiveInventoryAlerts: (filters) => ipcRenderer.invoke("inventory-alerts:getActive", filters),
    getAlertsByProduct: (productId) => ipcRenderer.invoke("inventory-alerts:getByProduct", productId),
    getProductAlertSettings: (productId) =>
      ipcRenderer.invoke("inventory-alerts:getSettings", productId),
    updateProductAlertSettings: (productId, settings) =>
      ipcRenderer.invoke("inventory-alerts:updateSettings", productId, settings)
  },
  sales: {
    getSales: () => ipcRenderer.invoke("sales:getAll"),
    createSale: (sale) => ipcRenderer.invoke("sales:create", sale)
  },
  cashRegister: {
    openShift: (openingAmount) => ipcRenderer.invoke("cash-register:open", openingAmount),
    getActiveShift: () => ipcRenderer.invoke("cash-register:getActive"),
    closeShift: (realAmount) => ipcRenderer.invoke("cash-register:close", realAmount),
    getShiftHistory: () => ipcRenderer.invoke("cash-register:history")
  },
  payments: {
    validatePayment: (payload) => ipcRenderer.invoke("payments:validate", payload),
    attachProofAndUpload: (payload) => ipcRenderer.invoke("payments:attachProof", payload),
    attachProofToSale: (payload) => ipcRenderer.invoke("payments:attachProofToSale", payload),
    getPendingProofSales: () => ipcRenderer.invoke("payments:getPendingProofSales"),
    getProofForSale: (saleId) => ipcRenderer.invoke("payments:getProof", saleId)
  },
  customers: {
    createCustomer: (customer) => ipcRenderer.invoke("customers:create", customer),
    updateCustomer: (customer) => ipcRenderer.invoke("customers:update", customer),
    searchCustomers: (query) => ipcRenderer.invoke("customers:search", query),
    getCustomerDetail: (customerId) => ipcRenderer.invoke("customers:get", customerId),
    listPaged: (filters) => ipcRenderer.invoke("customers:listPaged", filters)
  },
  storeCredit: {
    grantCredit: (payload) => ipcRenderer.invoke("store-credit:grant", payload),
    getBalance: (customerId) => ipcRenderer.invoke("store-credit:balance", customerId),
    listMovements: (customerId) => ipcRenderer.invoke("store-credit:movements", customerId)
  },
  salesHistory: {
    listSales: (filters) => ipcRenderer.invoke("sales-history:list", filters),
    getSaleDetail: (saleId) => ipcRenderer.invoke("sales-history:get", saleId),
    attachProofToSale: (payload) => ipcRenderer.invoke("sales-history:attachProof", payload)
  },
  dailyReports: {
    getDailySummary: (date) => ipcRenderer.invoke("daily-reports:summary", date),
    getDailySales: (date) => ipcRenderer.invoke("daily-reports:sales", date),
    getDailyShifts: (date) => ipcRenderer.invoke("daily-reports:shifts", date),
    generateDailyReportPDF: (date) => ipcRenderer.invoke("daily-reports:generatePdf", date),
    openReportPDF: (filePath) => ipcRenderer.invoke("daily-reports:openPdf", filePath)
  },
  dashboard: {
    getSummary: (date) => ipcRenderer.invoke("dashboard:summary", date)
  },
  dataSafety: {
    getBackupStatus: () => ipcRenderer.invoke("data-safety:getBackupStatus"),
    listBackups: () => ipcRenderer.invoke("data-safety:listBackups"),
    createBackupNow: () => ipcRenderer.invoke("data-safety:createBackup"),
    restoreBackup: (payload) => ipcRenderer.invoke("data-safety:restore", payload),
    restartApp: () => ipcRenderer.invoke("data-safety:restart"),
    getDbHealth: () => ipcRenderer.invoke("data-safety:getDbHealth")
  },
  tournaments: {
    createTournament: (payload) => ipcRenderer.invoke("tournaments:create", payload),
    updateTournament: (payload) => ipcRenderer.invoke("tournaments:update", payload),
    listTournaments: (filters) => ipcRenderer.invoke("tournaments:list", filters),
    listTournamentsPaged: (filters) => ipcRenderer.invoke("tournaments:listPaged", filters),
    getTournamentDetail: (id) => ipcRenderer.invoke("tournaments:get", id),
    addParticipant: (payload) => ipcRenderer.invoke("tournaments:addParticipant", payload),
    removeParticipant: (payload) => ipcRenderer.invoke("tournaments:removeParticipant", payload),
    sellEntry: (payload) => ipcRenderer.invoke("tournaments:sellEntry", payload),
    closeTournament: (id) => ipcRenderer.invoke("tournaments:close", id),
    assignWinner: (payload) => ipcRenderer.invoke("tournaments:assignWinner", payload),
    deleteTournament: (id) => ipcRenderer.invoke("tournaments:delete", id)
  },
  gameTypes: {
    listGameTypes: (activeOnly) => ipcRenderer.invoke("game-types:list", activeOnly),
    createGameType: (payload) => ipcRenderer.invoke("game-types:create", payload),
    updateGameType: (payload) => ipcRenderer.invoke("game-types:update", payload)
  },
  categories: {
    listCategories: (activeOnly) => ipcRenderer.invoke("categories:list", activeOnly)
  },
  expansions: {
    getExpansionsByGame: (gameTypeId, includeInactive) =>
      ipcRenderer.invoke("expansions:listByGame", gameTypeId, includeInactive),
    getExpansionById: (expansionId) => ipcRenderer.invoke("expansions:getById", expansionId),
    createExpansion: (payload) => ipcRenderer.invoke("expansions:create", payload),
    updateExpansion: (payload) => ipcRenderer.invoke("expansions:update", payload),
    deactivateExpansion: (expansionId) => ipcRenderer.invoke("expansions:deactivate", expansionId),
    deleteExpansion: (expansionId) => ipcRenderer.invoke("expansions:delete", expansionId)
  },
  inventorySync: {
    getSyncStatus: () => ipcRenderer.invoke("inventory-sync:getStatus"),
    runSyncNow: () => ipcRenderer.invoke("inventory-sync:run"),
    reconcileNow: () => ipcRenderer.invoke("inventory-sync:reconcile")
  },
  sync: {
    getSyncState: (provider) => ipcRenderer.invoke("sync:get", provider),
    updateSyncState: (provider, state) => ipcRenderer.invoke("sync:update", provider, state)
  }
});
