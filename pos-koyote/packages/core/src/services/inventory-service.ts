import { InventoryItem, InventoryState } from "../models/inventory";
import { Product } from "../models/product";

function assertPositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
}

function getItem(state: InventoryState, productId: string): InventoryItem | undefined {
  return state.items[productId];
}

function setItem(state: InventoryState, item: InventoryItem): InventoryState {
  return {
    ...state,
    items: {
      ...state.items,
      [item.productId]: item
    }
  };
}

export function createInventoryState(): InventoryState {
  return { items: {} };
}

// Returns null when stock is unlimited (non-tracked products).
export function getAvailableStock(state: InventoryState, product: Product): number | null {
  if (!product.isStockTracked) {
    return null;
  }
  return getItem(state, product.id)?.quantity ?? 0;
}

export function increaseStock(
  state: InventoryState,
  product: Product,
  amount: number
): InventoryState {
  if (!product.isStockTracked) {
    return state;
  }

  assertPositiveInteger(amount, "Amount");
  const current = getItem(state, product.id)?.quantity ?? 0;
  return setItem(state, { productId: product.id, quantity: current + amount });
}

export function decreaseStock(
  state: InventoryState,
  product: Product,
  amount: number
): InventoryState {
  if (!product.isStockTracked) {
    return state;
  }

  assertPositiveInteger(amount, "Amount");
  const current = getItem(state, product.id)?.quantity ?? 0;
  if (current - amount < 0) {
    throw new Error("Insufficient stock.");
  }

  return setItem(state, { productId: product.id, quantity: current - amount });
}
