export {};

type AsyncFn = (...args: any[]) => Promise<any>;

type ProductApi = {
  getProducts: AsyncFn;
  getTopProducts: AsyncFn;
  getRecentProducts: AsyncFn;
  listPaged: AsyncFn;
  createProduct: AsyncFn;
  updateProduct: AsyncFn;
};

type InventoryApi = {
  getInventory: AsyncFn;
  updateStock: AsyncFn;
};

type InventoryAlertsApi = {
  getActiveInventoryAlerts: AsyncFn;
  getAlertsByProduct: AsyncFn;
  getProductAlertSettings: AsyncFn;
  updateProductAlertSettings: AsyncFn;
};

type SalesApi = {
  getSales: AsyncFn;
  createSale: AsyncFn;
};

type CashRegisterApi = {
  openShift: AsyncFn;
  getActiveShift: AsyncFn;
  closeShift: AsyncFn;
  getShiftHistory: AsyncFn;
};

type PaymentsApi = {
  validatePayment: AsyncFn;
  attachProofAndUpload: AsyncFn;
  attachProofToSale: AsyncFn;
  getPendingProofSales: AsyncFn;
  getProofForSale: AsyncFn;
};

type CustomersApi = {
  createCustomer: AsyncFn;
  updateCustomer: AsyncFn;
  searchCustomers: AsyncFn;
  getCustomerDetail: AsyncFn;
  listPaged: AsyncFn;
};

type StoreCreditApi = {
  grantCredit: AsyncFn;
  getBalance: AsyncFn;
  listMovements: AsyncFn;
};

type SalesHistoryApi = {
  listSales: AsyncFn;
  getSaleDetail: AsyncFn;
  attachProofToSale: AsyncFn;
};

type DailyReportsApi = {
  getDailySummary: AsyncFn;
  getDailySales: AsyncFn;
  getDailyShifts: AsyncFn;
  generateDailyReportPDF: AsyncFn;
  openReportPDF: AsyncFn;
};

type DashboardApi = {
  getSummary: AsyncFn;
};

type DataSafetyApi = {
  getBackupStatus: AsyncFn;
  listBackups: AsyncFn;
  createBackupNow: AsyncFn;
  restoreBackup: AsyncFn;
  restartApp: AsyncFn;
  getDbHealth: AsyncFn;
};

type TournamentsApi = {
  createTournament: AsyncFn;
  updateTournament: AsyncFn;
  listTournaments: AsyncFn;
  listTournamentsPaged: AsyncFn;
  getTournamentDetail: AsyncFn;
  addParticipant: AsyncFn;
  removeParticipant: AsyncFn;
  sellEntry: AsyncFn;
  closeTournament: AsyncFn;
  assignWinner: AsyncFn;
  deleteTournament: AsyncFn;
};

type GameTypesApi = {
  listGameTypes: AsyncFn;
  createGameType: AsyncFn;
  updateGameType: AsyncFn;
};

type ExpansionsApi = {
  getExpansionsByGame: AsyncFn;
  getExpansionById: AsyncFn;
  createExpansion: AsyncFn;
  updateExpansion: AsyncFn;
  deactivateExpansion: AsyncFn;
  deleteExpansion: AsyncFn;
};

type InventorySyncApi = {
  getSyncStatus: AsyncFn;
  runSyncNow: AsyncFn;
  reconcileNow: AsyncFn;
};

type SyncApi = {
  getSyncState: AsyncFn;
  updateSyncState: AsyncFn;
};

type TerminalAuthState = {
  activated: boolean;
  terminalId: string | null;
  branchId: string | null;
  status: "not_activated" | "active" | "offline" | "revoked";
  activatedAt: string | null;
  lastVerifiedAt: string | null;
  messageCode: string | null;
};

type TerminalRotateResult = {
  status: "active" | "offline" | "revoked" | "not_activated";
  state: TerminalAuthState;
};

type TerminalAuthApi = {
  getState: () => Promise<TerminalAuthState>;
  activate: (
    activationApiKey: string
  ) => Promise<{ ok: true; state: TerminalAuthState } | { ok: false; error: string; code: string }>;
  rotate: () => Promise<TerminalRotateResult>;
  clear: () => Promise<TerminalAuthState>;
  onStateChanged: (handler: (state: TerminalAuthState) => void) => () => void;
};

type PosUserSession = {
  authenticated: boolean;
  status: "active" | "expired" | "not_authenticated";
  user: {
    id: string;
    role: "ADMIN" | "EMPLOYEE";
    branchId: string | null;
    displayName: string;
    expiresAt: string;
  } | null;
};

type PosUserAuthApi = {
  getSession: () => Promise<PosUserSession>;
  loginWithPin: (
    pin: string
  ) => Promise<
    | { ok: true; session: PosUserSession["user"] & { accessToken: string; cachedAt: string } }
    | { ok: false; error: string; code: string }
  >;
  logout: () => Promise<PosUserSession>;
};

type ElectronApi = {
  products: ProductApi;
  inventory: InventoryApi;
  inventoryAlerts: InventoryAlertsApi;
  sales: SalesApi;
  cashRegister: CashRegisterApi;
  payments: PaymentsApi;
  customers: CustomersApi;
  storeCredit: StoreCreditApi;
  salesHistory: SalesHistoryApi;
  dailyReports: DailyReportsApi;
  dashboard: DashboardApi;
  dataSafety: DataSafetyApi;
  tournaments: TournamentsApi;
  gameTypes: GameTypesApi;
  expansions: ExpansionsApi;
  inventorySync: InventorySyncApi;
  sync: SyncApi;
};

type KoyoteBridge = {
  version: string;
  terminalAuth: TerminalAuthApi;
};

declare global {
  interface Window {
    api?: ElectronApi;
    koyote?: KoyoteBridge;
    koyotePosUserAuth?: PosUserAuthApi;
  }
}
