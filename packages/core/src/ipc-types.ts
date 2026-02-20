import type {
  Customer,
  InventoryState,
  InventoryAlert,
  Expansion,
  Category,
  GameType,
  ProductAlertSettings,
  ProductListItem,
  ProductStockStatus,
  PaymentMethod,
  PaymentValidationResult,
  Product,
  ProductCategory,
  Sale,
  Shift,
  StoreCreditMovement,
  SyncState,
  Tournament,
  TournamentParticipant,
  TournamentPrize,
  TournamentPrizeType,
  TournamentStatus
} from "./index";

export type ProductsIpc = {
  getProducts: () => Product[];
  getTopProducts: (limit: number) => Product[];
  getRecentProducts: (limit: number) => Product[];
  listPaged: (filters: {
    search?: string;
    category?: ProductCategory;
    categoryCloudId?: string;
    gameTypeId?: string;
    stockStatus?: ProductStockStatus;
    sortBy?: "NAME" | "CREATED_AT" | "STOCK";
    sortDir?: "ASC" | "DESC";
    page?: number;
    pageSize?: number;
  }) => {
    items: ProductListItem[];
    total: number;
    page: number;
    pageSize: number;
  };
  createProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
};

export type CategoriesIpc = {
  listCategories: (activeOnly?: boolean) => Category[];
};

export type InventoryIpc = {
  getInventory: () => InventoryState;
  updateStock: (productId: string, delta: number) => InventoryState;
};

export type InventoryAlertsIpc = {
  getActiveInventoryAlerts: (filters?: { type?: InventoryAlert["type"] }) => InventoryAlert[];
  getAlertsByProduct: (productId: string) => InventoryAlert[];
  getProductAlertSettings: (productId: string) => ProductAlertSettings;
  updateProductAlertSettings: (
    productId: string,
    settings: Omit<ProductAlertSettings, "productId" | "updatedAt">
  ) => ProductAlertSettings;
};

export type SalesIpc = {
  createSale: (sale: Sale) => void;
  getSales: () => Sale[];
};

export type SyncIpc = {
  getSyncState: (provider: string) => SyncState | null;
  updateSyncState: (provider: string, state: SyncState) => void;
};

export type CashRegisterIpc = {
  openShift: (openingAmount: number) => Shift;
  getActiveShift: () => Shift | null;
  closeShift: (realAmount: number) => Shift;
  getShiftHistory: () => Shift[];
};

export type PaymentsIpc = {
  validatePayment: (payload: {
    method: PaymentMethod | null;
    amount: number;
    proofProvided: boolean;
  }) => PaymentValidationResult;
  attachProofAndUpload: (payload: {
    fileBuffer: ArrayBuffer;
    fileName: string;
    mimeType: string;
    ticketNumber: string;
    method: PaymentMethod;
  }) => { proofFileRef: string; fileName: string };
  attachProofToSale: (payload: {
    saleId: string;
    fileBuffer: ArrayBuffer;
    fileName: string;
    mimeType: string;
    method: PaymentMethod;
  }) => { proofFileRef: string; fileName: string };
  getPendingProofSales: () => Sale[];
  getProofForSale: (saleId: string) => string | null;
};

export type CustomersIpc = {
  createCustomer: (customer: Customer) => Customer;
  updateCustomer: (customer: Customer) => Customer;
  searchCustomers: (query: string) => Customer[];
  getCustomerDetail: (customerId: string) => Customer | null;
  listPaged: (filters: {
    name?: string;
    phone?: string;
    email?: string;
    page?: number;
    pageSize?: number;
  }) => {
    items: Customer[];
    total: number;
    page: number;
    pageSize: number;
  };
};

export type StoreCreditIpc = {
  grantCredit: (payload: {
    customerId: string;
    amount: number;
    reason: StoreCreditMovement["reason"];
    referenceType: StoreCreditMovement["referenceType"];
    referenceId?: string | null;
  }) => StoreCreditMovement;
  getBalance: (customerId: string) => { amount: number; currency: "MXN" };
  listMovements: (customerId: string) => StoreCreditMovement[];
};

export type GameTypesIpc = {
  listGameTypes: (activeOnly?: boolean) => GameType[];
  createGameType: (payload: { name: string }) => GameType;
  updateGameType: (payload: { id: string; name: string; active: boolean }) => GameType;
};

export type ExpansionsIpc = {
  getExpansionsByGame: (gameTypeId: string, includeInactive?: boolean) => Expansion[];
  getExpansionById: (expansionId: string) => Expansion | null;
  createExpansion: (payload: {
    gameTypeId: string;
    name: string;
    code?: string | null;
    releaseDate?: string | null;
  }) => Expansion;
  updateExpansion: (payload: {
    id: string;
    gameTypeId: string;
    name: string;
    code?: string | null;
    releaseDate?: string | null;
    active: boolean;
  }) => Expansion;
  deactivateExpansion: (expansionId: string) => Expansion;
  deleteExpansion: (expansionId: string) => void;
};

export type TournamentsIpc = {
  createTournament: (payload: {
    name: string;
    game: string;
    gameTypeId?: string | null;
    expansionId?: string | null;
    date: string;
    maxCapacity: number;
    entryPriceAmount: number;
    prizeType: TournamentPrizeType;
    prizeValueAmount: number;
    winnerCount: number;
    prizeDistribution: number[];
  }) => Tournament;
  updateTournament: (tournament: Tournament) => Tournament;
  listTournaments: (filters?: {
    from?: string;
    to?: string;
    game?: string;
    gameTypeId?: string;
    minParticipants?: number;
    maxParticipants?: number;
  }) => Tournament[];
  listTournamentsPaged: (filters: {
    from?: string;
    to?: string;
    gameTypeId?: string;
    minParticipants?: number;
    maxParticipants?: number;
    sortBy?: "DATE" | "GAME" | "PARTICIPANTS";
    sortDir?: "ASC" | "DESC";
    page?: number;
    pageSize?: number;
  }) => {
    items: { tournament: Tournament; participantCount: number }[];
    total: number;
    page: number;
    pageSize: number;
  };
  getTournamentDetail: (id: string) => {
    tournament: Tournament;
    participants: TournamentParticipant[];
    prizes: TournamentPrize[];
  } | null;
  addParticipant: (payload: {
    tournamentId: string;
    name: string;
    customerId?: string | null;
  }) => TournamentParticipant;
  removeParticipant: (payload: { tournamentId: string; participantId: string }) => void;
  sellEntry: (payload: {
    tournamentId: string;
    participant: {
      name: string;
      customerId?: string | null;
    };
    payment: {
      method: PaymentMethod;
      reference?: string | null;
      proofStatus: "ATTACHED" | "PENDING";
      proofFile?: {
        fileBuffer: ArrayBuffer;
        fileName: string;
        mimeType: string;
      } | null;
    };
  }) => { sale: Sale; participant: TournamentParticipant };
  closeTournament: (id: string) => Tournament;
  assignWinner: (payload: {
    tournamentId: string;
    participantIds: string[];
    productNotes?: string | null;
  }) => TournamentPrize;
  deleteTournament: (tournamentId: string) => void;
};

export type IpcApi = {
  products: ProductsIpc;
  inventory: InventoryIpc;
  inventoryAlerts: InventoryAlertsIpc;
  sales: SalesIpc;
  sync: SyncIpc;
  inventorySync: {
    getSyncStatus: (posId: string) => {
      posId: string;
      lastSyncAt: string | null;
      lastAttemptAt: string | null;
      lastResult: string | null;
      pendingCount: number | null;
    };
  };
  cashRegister: CashRegisterIpc;
  payments: PaymentsIpc;
  customers: CustomersIpc;
  storeCredit: StoreCreditIpc;
  tournaments: TournamentsIpc;
  categories: CategoriesIpc;
  gameTypes: GameTypesIpc;
  expansions: ExpansionsIpc;
  dataSafety: {
    getBackupStatus: () => { status: string; at: string | null; message: string | null };
    listBackups: () => { id: string; filename: string; createdAt: string; sizeBytes: number }[];
    createBackupNow: () => { filename: string };
    restoreBackup: (payload: { filename: string; confirm: boolean }) => { restored: boolean };
    restartApp: () => { restarted: boolean };
    getDbHealth: () => { status: string; message: string | null };
  };
  dashboard: {
    getSummary: (date: string) => {
      dailyStatus: {
        date: string;
        shiftStatus: "OPEN" | "CLOSED";
        openedAt: string | null;
        salesTotal: number;
        salesCount: number;
      };
      salesSummary: {
        total: number;
        byMethod: Record<PaymentMethod, number>;
        averageTicket: number;
      };
      alerts: {
        outOfStock: {
          id: string;
          productId: string;
          productName: string;
          currentStock: number;
          threshold: number;
          createdAt: string;
        }[];
        lowStock: {
          id: string;
          productId: string;
          productName: string;
          currentStock: number;
          threshold: number;
          createdAt: string;
        }[];
        pendingProofs: { id: string; totalAmount: number; createdAt: string }[];
        tournamentsWithoutWinners: { id: string; name: string; date: string; updatedAt: string }[];
      };
      recentActivity: { type: "SALE" | "CUSTOMER" | "TOURNAMENT"; id: string; label: string; amount?: number; createdAt: string }[];
    };
  };
  salesHistory: {
    listSales: (filters: {
      from?: string;
      to?: string;
      paymentMethod?: PaymentMethod;
      proofStatus?: "PENDING" | "ATTACHED";
      gameTypeId?: string;
      expansionId?: string;
      customerId?: string;
      page?: number;
      pageSize?: number;
    }) => { items: Sale[]; total: number; page: number; pageSize: number };
    getSaleDetail: (saleId: string) => Sale | null;
    attachProofToSale: (payload: {
      saleId: string;
      fileBuffer: ArrayBuffer;
      fileName: string;
      mimeType: string;
      method: PaymentMethod;
    }) => { proofFileRef: string; fileName: string };
  };
  dailyReports: {
    getDailySummary: (date: string) => {
      date: string;
      totalAmount: number;
      salesCount: number;
      byMethod: Record<PaymentMethod, number>;
      pendingProofs: number;
      credit: { granted: number; used: number };
    };
    getDailySales: (date: string) => Sale[];
    getDailyShifts: (date: string) => Shift[];
    generateDailyReportPDF: (date: string) => string;
    openReportPDF: (filePath: string) => string;
  };
};
