require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs"
  }
});

const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const {
  loadSyncState,
  saveSyncState,
  startDriveConnection,
  completeDriveConnection,
  uploadInventoryWorkbook,
  downloadAndReconcile
} = require("./integrations/google-drive/drive-sync.ts");
const {
  initializeDb,
  createProductRepository,
  createInventoryRepository,
  createInventoryMovementRepository,
  createAppliedEventRepository,
  createInventorySyncRepository,
  createProductAlertRepository,
  createInventoryAlertRepository,
  createSaleRepository,
  createSyncStateRepository,
  createShiftRepository,
  createCustomerRepository,
  createGameTypeRepository,
  createExpansionRepository,
  createStoreCreditRepository,
  createDashboardRepository,
  createTournamentRepository,
  createParticipantRepository,
  createTournamentPrizeRepository
} = require("../../packages/db/src/index.ts");
const { DataSafetyManager } = require("./data-safety");
const { MockCloudSyncClient } = require("./integrations/inventory-sync/cloud-client");
const { TerminalCloudSyncClient } = require("./integrations/inventory-sync/terminal-cloud-client");
const { createTerminalAuthService } = require("./integrations/terminal-auth/terminal-auth.ts");
const { runInventorySync } = require("./integrations/inventory-sync/reconcile");
const { registerProductIpc } = require("./ipc/product-ipc");
const { registerInventoryIpc } = require("./ipc/inventory-ipc");
const { registerInventoryAlertsIpc } = require("./ipc/inventory-alerts-ipc");
const { registerSaleIpc } = require("./ipc/sale-ipc");
const { registerSyncIpc } = require("./ipc/sync-ipc");
const { registerCashRegisterIpc } = require("./ipc/cash-register-ipc");
const { registerPaymentsIpc } = require("./ipc/payments-ipc");
const { registerSalesHistoryIpc } = require("./ipc/sales-history-ipc");
const { registerCustomerIpc } = require("./ipc/customer-ipc");
const { registerGameTypeIpc } = require("./ipc/game-type-ipc");
const { registerExpansionIpc } = require("./ipc/expansion-ipc");
const { registerStoreCreditIpc } = require("./ipc/store-credit-ipc");
const { registerDailyReportsIpc } = require("./ipc/daily-reports-ipc");
const { registerDashboardIpc } = require("./ipc/dashboard-ipc");
const { registerTournamentIpc } = require("./ipc/tournament-ipc");
const { registerDataSafetyIpc } = require("./ipc/data-safety-ipc");
const { registerInventorySyncIpc } = require("./ipc/inventory-sync-ipc");

const isDev = !app.isPackaged;
const startUrl = process.env.ELECTRON_START_URL || "http://localhost:3000";
let mainWindow = null;
let terminalAuthService = null;

const envPath = path.join(__dirname, "..", "..", ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

function getDriveConfig() {
  const clientId = process.env.DRIVE_CLIENT_ID;
  if (!clientId) {
    throw new Error("DRIVE_CLIENT_ID is missing.");
  }

  return {
    clientId,
    clientSecret: process.env.DRIVE_CLIENT_SECRET,
    scopes: (process.env.DRIVE_SCOPES || "https://www.googleapis.com/auth/drive.file")
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean),
    fileName: process.env.DRIVE_FILE_NAME || "productos-inventario.xlsx"
  };
}

ipcMain.handle("drive:getState", async () => {
  return loadSyncState();
});

ipcMain.handle("drive:connect", async () => {
  const deviceCode = await startDriveConnection(getDriveConfig());
  return deviceCode;
});

ipcMain.handle("drive:complete", async (_event, deviceCode) => {
  const state = await completeDriveConnection(getDriveConfig(), deviceCode);
  return state;
});

ipcMain.handle("drive:upload", async (_event, dataBuffer) => {
  const state = loadSyncState();
  const buffer = dataBuffer instanceof ArrayBuffer ? dataBuffer : dataBuffer.buffer;
  return uploadInventoryWorkbook(getDriveConfig(), buffer, state);
});

ipcMain.handle("drive:download", async (_event, localSnapshot) => {
  if (!localSnapshot?.products || !localSnapshot?.inventory) {
    throw new Error("Local snapshot missing.");
  }

  const result = await downloadAndReconcile(
    getDriveConfig(),
    localSnapshot.products,
    localSnapshot.inventory
  );
  saveSyncState(result.state);
  return result;
});

ipcMain.handle("terminal-auth:get-state", async () => {
  if (!terminalAuthService) {
    return {
      activated: false,
      terminalId: null,
      branchId: null,
      status: "not_activated",
      activatedAt: null,
      lastVerifiedAt: null,
      messageCode: null
    };
  }

  return terminalAuthService.getState();
});

ipcMain.handle("terminal-auth:activate", async (_event, payload) => {
  if (!terminalAuthService) {
    return { ok: false, error: "terminal auth unavailable", code: "TERMINAL_AUTH_UNAVAILABLE" };
  }

  const apiKey = typeof payload?.activationApiKey === "string" ? payload.activationApiKey : "";
  try {
    const state = await terminalAuthService.activate(apiKey);
    if (mainWindow) {
      mainWindow.webContents.send("terminal-auth:state-changed", state);
    }
    return { ok: true, state };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "activation failed",
      code: error?.code || "UNKNOWN"
    };
  }
});

ipcMain.handle("terminal-auth:rotate", async () => {
  if (!terminalAuthService) {
    throw new Error("terminal auth unavailable");
  }

  const result = await terminalAuthService.rotate();
  if (mainWindow) {
    mainWindow.webContents.send("terminal-auth:state-changed", result.state);
  }
  return result;
});

ipcMain.handle("terminal-auth:clear", async () => {
  if (!terminalAuthService) {
    return {
      activated: false,
      terminalId: null,
      branchId: null,
      status: "not_activated",
      activatedAt: null,
      lastVerifiedAt: null,
      messageCode: null
    };
  }

  const state = terminalAuthService.clear("TERMINAL_REVOKED");
  if (mainWindow) {
    mainWindow.webContents.send("terminal-auth:state-changed", state);
  }
  return state;
});

function loadRoute(targetWindow, route = "/") {
  if (!targetWindow) {
    return;
  }

  if (isDev) {
    targetWindow
      .loadURL(`${startUrl}${route}`)
      .catch(() => targetWindow.loadURL(startUrl));
    return;
  }

  const basePath = path.join(__dirname, "..", "web", "out");
  if (route && route !== "/") {
    const safeRoute = route.replace(/^\/+/, "");
    const routePath = path.join(basePath, safeRoute, "index.html");
    if (fs.existsSync(routePath)) {
      targetWindow.loadFile(routePath);
    } else {
      const indexPath = path.join(basePath, "index.html");
      targetWindow.loadFile(indexPath);
    }
    return;
  }

  const indexPath = path.join(basePath, "index.html");
  targetWindow.loadFile(indexPath);
}

function createWindow(route = "/") {
  const createdWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: "#0b0f14",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  if (isDev) {
    loadRoute(createdWindow, route);
    createdWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    loadRoute(createdWindow, route);
  }

  return createdWindow;
}

function buildAppMenu(targetWindow) {
  const template = [
    {
      label: "Archivo",
      submenu: [
        {
          label: "Volver al inicio",
          click: () => loadRoute(targetWindow, "/dashboard")
        },
        { type: "separator" },
        { label: "Salir", role: "quit" }
      ]
    },
    {
      label: "Editar",
      submenu: [
        { label: "Deshacer", role: "undo" },
        { label: "Rehacer", role: "redo" },
        { type: "separator" },
        { label: "Cortar", role: "cut" },
        { label: "Copiar", role: "copy" },
        { label: "Pegar", role: "paste" },
        { label: "Seleccionar todo", role: "selectAll" }
      ]
    },
    {
      label: "Ver",
      submenu: [
        { label: "Recargar", role: "reload" },
        { label: "Forzar recarga", role: "forceReload" },
        { label: "Pantalla completa", role: "togglefullscreen" }
      ]
    },
    {
      label: "Ventana",
      submenu: [
        { label: "Minimizar", role: "minimize" },
        { label: "Cerrar", role: "close" }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  const dbPath = process.env.DB_PATH || path.join(app.getPath("userData"), "koyote.db");
  const dataSafety = new DataSafetyManager({
    dbPath,
    retentionCount: Number(process.env.BACKUP_RETENTION || 10)
  });

  try {
    dataSafety.ensureStartupBackup();
  } catch (error) {
    // Backup failures should not block app startup.
  }

  try {
    await dataSafety.createBackupNow();
  } catch (error) {
    // Pre-migration backup failures should not block app startup.
  }

  let db;
  try {
    db = initializeDb({ filepath: dbPath });
    dataSafety.setDb(db);
    dataSafety.setDbHealth("OK", null);
    dataSafety.setRecoveryMode(false);
  } catch (error) {
    dataSafety.setDbHealth(
      "CORRUPT",
      error instanceof Error ? error.message : "DB open failed."
    );
    dataSafety.setRecoveryMode(true);
    registerDataSafetyIpc(ipcMain, dataSafety);
    mainWindow = createWindow("/error/db");
    buildAppMenu(mainWindow);
    return;
  }
  const productRepo = createProductRepository(db);
  const inventoryRepo = createInventoryRepository(db);
  const inventoryMovementRepo = createInventoryMovementRepository(db);
  const appliedEventRepo = createAppliedEventRepository(db);
  const inventorySyncRepo = createInventorySyncRepository(db);
  const productAlertRepo = createProductAlertRepository(db);
  const inventoryAlertRepo = createInventoryAlertRepository(db);
  const saleRepo = createSaleRepository(db);
  const syncRepo = createSyncStateRepository(db);
  const shiftRepo = createShiftRepository(db);
  const customerRepo = createCustomerRepository(db);
  const gameTypeRepo = createGameTypeRepository(db);
  const expansionRepo = createExpansionRepository(db);
  const storeCreditRepo = createStoreCreditRepository(db);
  const dashboardRepo = createDashboardRepository(db);
  const tournamentRepo = createTournamentRepository(db);
  const participantRepo = createParticipantRepository(db);
  const prizeRepo = createTournamentPrizeRepository(db);
  terminalAuthService = createTerminalAuthService();

  registerDataSafetyIpc(ipcMain, dataSafety);
  registerInventorySyncIpc(ipcMain, inventorySyncRepo);
  registerProductIpc(ipcMain, productRepo, expansionRepo);
  registerInventoryIpc(ipcMain, inventoryRepo, productAlertRepo, inventoryAlertRepo);
  registerInventoryAlertsIpc(ipcMain, {
    productAlertRepo,
    inventoryAlertRepo,
    inventoryRepo
  });
  registerSaleIpc(ipcMain, {
    saleRepo,
    shiftRepo,
    inventoryRepo,
    productRepo,
    storeCreditRepo,
    productAlertRepo,
    inventoryAlertRepo,
    db
  });
  registerSyncIpc(ipcMain, syncRepo);
  registerCashRegisterIpc(ipcMain, shiftRepo, saleRepo);
  registerPaymentsIpc(ipcMain, saleRepo, getDriveConfig);
  registerSalesHistoryIpc(ipcMain, saleRepo, getDriveConfig);
  registerCustomerIpc(ipcMain, customerRepo);
  registerGameTypeIpc(ipcMain, gameTypeRepo);
  registerExpansionIpc(ipcMain, expansionRepo);
  registerStoreCreditIpc(ipcMain, storeCreditRepo);
  registerDailyReportsIpc(ipcMain, saleRepo, shiftRepo, storeCreditRepo);
  registerDashboardIpc(ipcMain, { saleRepo, shiftRepo, dashboardRepo });
  registerTournamentIpc(ipcMain, {
    tournamentRepo,
    participantRepo,
    prizeRepo,
    saleRepo,
    shiftRepo,
    productRepo,
    gameTypeRepo,
    expansionRepo,
    storeCreditRepo,
    db,
    getDriveConfig
  });

  const posId = process.env.POS_ID || "pos-local";
  const cloudClient =
    process.env.CLOUD_API_URL || process.env.API_URL || process.env.CLOUD_API_BASE_URL
      ? new TerminalCloudSyncClient((pathname, init) => terminalAuthService.authenticatedRequest(pathname, init))
      : new MockCloudSyncClient();
  runInventorySync({
    posId,
    cloudClient,
    inventoryRepo,
    movementRepo: inventoryMovementRepo,
    appliedEventRepo,
    syncRepo: inventorySyncRepo,
    productRepo,
    db
  }).catch(() => {
    // Inventory sync failures should not block POS startup.
  });

  mainWindow = createWindow();
  buildAppMenu(mainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
      buildAppMenu(mainWindow);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
