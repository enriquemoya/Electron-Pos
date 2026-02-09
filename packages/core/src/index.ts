export type { Money } from "./models/money";
export { createMoney, addMoney, multiplyMoney } from "./models/money";

export type { TcgMetadata } from "./models/tcg";
export type { GameType } from "./models/game-type";
export type { Expansion } from "./models/expansion";
export type { Product, ProductCategory } from "./models/product";
export type { ProductListItem, ProductStockStatus } from "./models/product-list";
export type { InventoryItem, InventoryState } from "./models/inventory";
export type {
  InventoryAlert,
  InventoryAlertStatus,
  InventoryAlertType,
  ProductAlertSettings
} from "./models/inventory-alert";
export {
  shouldTriggerLowStock,
  shouldTriggerOutOfStock,
  shouldResolveLowStock,
  shouldResolveOutOfStock
} from "./models/inventory-alert";

export type { SaleItem } from "./models/sale-item";
export { createSaleItem, updateSaleItemQuantity } from "./models/sale-item";

export type { Sale } from "./models/sale";
export { createEmptySale, calculateSaleTotal } from "./models/sale";

export type { Customer } from "./models/customer";
export { normalizeEmail, normalizePhone, validateCustomerInput } from "./models/customer";

export type { StoreCreditMovement } from "./models/store-credit";
export { calculateCreditBalance } from "./models/store-credit";

export type {
  PaymentMethod,
  PaymentProofStatus,
  PaymentValidationResult
} from "./models/payment";
export { requiresProof, deriveProofStatus, validatePayment } from "./models/payment";

export type { Shift, ShiftStatus } from "./models/shift";
export { openShift, closeShift, calculateExpectedAmount } from "./models/shift";

export type {
  Tournament,
  TournamentParticipant,
  TournamentPrize,
  TournamentPrizeType,
  TournamentStatus
} from "./models/tournament";
export { canAddParticipant, canAssignWinner } from "./models/tournament";

export type { SyncState, SyncStatus, SyncError } from "./sync/sync-state";
export { createInitialSyncState } from "./sync/sync-state";
export type {
  RemoteProductInput,
  ReconciliationConflict,
  ReconciliationConflictReason,
  ReconciliationResult
} from "./sync/inventory-reconciliation";
export { reconcileInventorySnapshot } from "./sync/inventory-reconciliation";

export type {
  IpcApi,
  ProductsIpc,
  InventoryIpc,
  SalesIpc,
  SyncIpc,
  CashRegisterIpc,
  CustomersIpc,
  StoreCreditIpc,
  GameTypesIpc,
  ExpansionsIpc
} from "./ipc-types";

export {
  createInventoryState,
  getAvailableStock,
  increaseStock,
  decreaseStock
} from "./services/inventory-service";

export {
  startSale,
  addItemToSale,
  removeItemFromSale,
  updateItemQuantityInSale
} from "./services/sale-service";
