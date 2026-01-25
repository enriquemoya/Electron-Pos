import { Money } from "./money";
import { TcgMetadata } from "./tcg";

export type ProductCategory =
  | "TCG_SEALED"
  | "TCG_SINGLE"
  | "ACCESSORY"
  | "COMMODITY"
  | "SERVICE";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: Money;
  isStockTracked: boolean;
  gameTypeId?: string | null;
  expansionId?: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional unified TCG metadata for any product type.
  tcg?: TcgMetadata;
};
