import * as XLSX from "xlsx";
import type { InventoryState, Product } from "@pos/core";
import { getAvailableStock } from "@pos/core";
import { esMX } from "../i18n";

export type ExportPayload = {
  products: Product[];
  inventory: InventoryState;
};

const headers = [
  esMX.excelHeaderProductId,
  esMX.excelHeaderName,
  esMX.excelHeaderCategory,
  esMX.excelHeaderPrice,
  esMX.excelHeaderIsStockTracked,
  esMX.excelHeaderStock,
  esMX.excelHeaderGame,
  esMX.excelHeaderExpansion,
  esMX.excelHeaderRarity,
  esMX.excelHeaderCondition,
  esMX.excelHeaderImageUrl
];

function toRow(product: Product, inventory: InventoryState) {
  const stock = getAvailableStock(inventory, product);
  return [
    product.id,
    product.name,
    product.category,
    product.price.amount,
    product.isStockTracked,
    stock ?? "",
    product.tcg?.game ?? "",
    product.tcg?.expansion ?? "",
    product.tcg?.rarity ?? "",
    product.tcg?.condition ?? "",
    product.tcg?.imageUrl ?? ""
  ];
}

export function buildProductsWorkbookWithSheet(payload: ExportPayload): XLSX.WorkBook {
  const rows = payload.products.map((product) => toRow(product, payload.inventory));
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, esMX.exportSheetName);
  return workbook;
}

export function exportProductsToExcel(payload: ExportPayload): Blob {
  const workbook = buildProductsWorkbookWithSheet(payload);
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  // The blob can later be uploaded to external storage (e.g., Drive) without changes.
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
