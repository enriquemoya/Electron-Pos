import type { InventoryState } from "../models/inventory";
import type { Money } from "../models/money";
import type { Product, ProductCategory } from "../models/product";
import type { TcgMetadata } from "../models/tcg";
import { getAvailableStock } from "../services/inventory-service";

export type RemoteProductInput = {
  productId?: string;
  name: string;
  category: ProductCategory;
  price: Money;
  isStockTracked: boolean;
  stock?: number;
  tcg?: TcgMetadata;
};

export type ReconciliationConflictReason = "PRICE_MISMATCH" | "STOCK_MISMATCH";

export type ReconciliationConflict = {
  productId: string;
  reasons: ReconciliationConflictReason[];
  local: {
    price: Money;
    stock: number | null;
  };
  remote: {
    price: Money;
    stock: number | null;
  };
};

export type ReconciliationResult = {
  create: RemoteProductInput[];
  conflicts: ReconciliationConflict[];
  unchanged: Product[];
};

function stocksMatch(local: number | null, remote: number | null): boolean {
  if (local === null || remote === null) {
    return true;
  }
  return local === remote;
}

// Compares local inventory to a remote snapshot without mutating local state.
export function reconcileInventorySnapshot(
  localProducts: Product[],
  localInventory: InventoryState,
  remoteProducts: RemoteProductInput[]
): ReconciliationResult {
  const create: RemoteProductInput[] = [];
  const conflicts: ReconciliationConflict[] = [];
  const unchanged: Product[] = [];

  remoteProducts.forEach((remote) => {
    if (!remote.productId) {
      create.push(remote);
      return;
    }

    const local = localProducts.find((product) => product.id === remote.productId);
    if (!local) {
      create.push(remote);
      return;
    }

    const localStock = local.isStockTracked ? getAvailableStock(localInventory, local) ?? 0 : null;
    const remoteStock = remote.isStockTracked ? remote.stock ?? 0 : null;
    const reasons: ReconciliationConflictReason[] = [];

    if (local.price.amount !== remote.price.amount) {
      reasons.push("PRICE_MISMATCH");
    }

    if (!stocksMatch(localStock, remoteStock)) {
      reasons.push("STOCK_MISMATCH");
    }

    if (reasons.length > 0) {
      conflicts.push({
        productId: local.id,
        reasons,
        local: {
          price: local.price,
          stock: localStock
        },
        remote: {
          price: remote.price,
          stock: remoteStock
        }
      });
    } else {
      unchanged.push(local);
    }
  });

  return { create, conflicts, unchanged };
}
