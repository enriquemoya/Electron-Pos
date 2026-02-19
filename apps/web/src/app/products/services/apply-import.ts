import type { InventoryState, Product } from "@pos/core";
import { getAvailableStock } from "@pos/core";
import type { ImportResult } from "./excel-import";

type ApiProducts = {
  createProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
};

type ApiInventory = {
  updateStock: (productId: string, delta: number) => Promise<InventoryState>;
};

// Applies an import result to SQLite through IPC, preserving DB as source of truth.
export async function applyImportResult(
  result: ImportResult,
  currentProducts: Product[],
  currentInventory: InventoryState
) {
  const api = window.api;
  if (!api) {
    throw new Error("IPC unavailable.");
  }

  const currentMap = new Map(currentProducts.map((product) => [product.id, product]));

  for (const product of result.products) {
    if (currentMap.has(product.id)) {
      await api.products.updateProduct(product);
    } else {
      await api.products.createProduct(product);
    }

    if (product.isStockTracked) {
      const desired = result.inventory.items[product.id]?.quantity ?? 0;
      const current = getAvailableStock(currentInventory, product) ?? 0;
      const delta = desired - current;
      if (delta !== 0) {
        await api.inventory.updateStock(product.id, delta);
      }
    }
  }
}
