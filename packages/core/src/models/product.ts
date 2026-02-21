import { Money } from "./money";
import { TcgMetadata } from "./tcg";

export type ProductCategory = string;

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  categoryCloudId?: string | null;
  price: Money;
  isStockTracked: boolean;
  gameTypeId?: string | null;
  expansionId?: string | null;
  gameCloudId?: string | null;
  expansionCloudId?: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional unified TCG metadata for any product type.
  tcg?: TcgMetadata;
};
