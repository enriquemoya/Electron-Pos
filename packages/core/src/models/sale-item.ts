import { Money, multiplyMoney } from "./money";

export type SaleItem = {
  productId: string;
  name: string;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
};

// Enforce positive integer quantities.
function assertPositiveQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer.");
  }
}

export function createSaleItem(
  productId: string,
  name: string,
  unitPrice: Money,
  quantity: number
): SaleItem {
  assertPositiveQuantity(quantity);
  return {
    productId,
    name,
    unitPrice,
    quantity,
    lineTotal: multiplyMoney(unitPrice, quantity)
  };
}

export function updateSaleItemQuantity(item: SaleItem, quantity: number): SaleItem {
  assertPositiveQuantity(quantity);
  return {
    ...item,
    quantity,
    lineTotal: multiplyMoney(item.unitPrice, quantity)
  };
}
