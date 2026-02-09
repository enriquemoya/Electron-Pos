import type { Product } from "./product";

export type ProductStockStatus = "NORMAL" | "LOW" | "OUT";

export type ProductListItem = {
  product: Product;
  stock: number | null;
  stockStatus: ProductStockStatus;
};
