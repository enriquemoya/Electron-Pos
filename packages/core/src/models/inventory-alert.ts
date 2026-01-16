export type InventoryAlertType = "LOW_STOCK" | "OUT_OF_STOCK";

export type InventoryAlertStatus = "ACTIVE" | "RESOLVED";

export type InventoryAlert = {
  id: string;
  productId: string;
  type: InventoryAlertType;
  currentStock: number;
  threshold: number;
  status: InventoryAlertStatus;
  createdAt: string;
  resolvedAt?: string | null;
};

export type ProductAlertSettings = {
  productId: string;
  minStock: number;
  alertsEnabled: boolean;
  outOfStockEnabled: boolean;
  updatedAt: string;
};

export function shouldTriggerLowStock(current: number, threshold: number) {
  return current <= threshold;
}

export function shouldTriggerOutOfStock(current: number) {
  return current === 0;
}

export function shouldResolveLowStock(current: number, threshold: number) {
  return current > threshold;
}

export function shouldResolveOutOfStock(current: number) {
  return current > 0;
}
