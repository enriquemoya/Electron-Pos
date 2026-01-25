import { SaleItem, updateSaleItemQuantity } from "../models/sale-item";
import { calculateSaleTotal, createEmptySale, Sale } from "../models/sale";

// Recalculate totals without mutating the incoming sale.
function recomputeSale(sale: Sale, items: SaleItem[]): Sale {
  return {
    ...sale,
    items,
    total: calculateSaleTotal(items)
  };
}

export function startSale(id: string, shiftId: string, createdAt: string): Sale {
  return createEmptySale(id, shiftId, createdAt);
}

export function addItemToSale(sale: Sale, item: SaleItem): Sale {
  const existingIndex = sale.items.findIndex((entry) => entry.productId === item.productId);
  if (existingIndex === -1) {
    return recomputeSale(sale, [...sale.items, item]);
  }

  const existing = sale.items[existingIndex];
  const merged = updateSaleItemQuantity(existing, existing.quantity + item.quantity);
  const nextItems = sale.items.map((entry, index) => (index === existingIndex ? merged : entry));

  return recomputeSale(sale, nextItems);
}

export function removeItemFromSale(sale: Sale, productId: string): Sale {
  const nextItems = sale.items.filter((item) => item.productId !== productId);
  return recomputeSale(sale, nextItems);
}

export function updateItemQuantityInSale(sale: Sale, productId: string, quantity: number): Sale {
  const nextItems = sale.items.map((item) =>
    item.productId === productId ? updateSaleItemQuantity(item, quantity) : item
  );
  return recomputeSale(sale, nextItems);
}
