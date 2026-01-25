import * as XLSX from "xlsx";
import type { InventoryState, Product, ProductCategory } from "@pos/core";
import { createMoney, createInventoryState, getAvailableStock, increaseStock, decreaseStock } from "@pos/core";

export type ImportErrorCode =
  | "MISSING_NAME"
  | "MISSING_CATEGORY"
  | "INVALID_CATEGORY"
  | "INVALID_PRICE"
  | "INVALID_STOCK_TRACKED"
  | "INVALID_STOCK"
  | "PRODUCT_NOT_FOUND"
  | "UNKNOWN";

export type ImportError = {
  row: number;
  code: ImportErrorCode;
};

export type ImportSummary = {
  created: number;
  updated: number;
  errors: ImportError[];
};

export type ImportResult = {
  products: Product[];
  inventory: InventoryState;
  summary: ImportSummary;
};

export type ImportParams = {
  file: ArrayBuffer;
  products: Product[];
  inventory: InventoryState;
  nowIso: string;
  createId: () => string;
};

type ParsedRow = {
  productId?: string;
  name?: string;
  category?: ProductCategory;
  price?: number;
  isStockTracked?: boolean;
  stock?: number;
  game?: string;
  expansion?: string;
  rarity?: string;
  condition?: string;
  imageUrl?: string;
};

const categoryValues: ProductCategory[] = [
  "TCG_SEALED",
  "TCG_SINGLE",
  "ACCESSORY",
  "COMMODITY",
  "SERVICE"
];

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1 ? true : value === 0 ? false : null;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "si", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }
  return null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function readRows(file: ArrayBuffer): unknown[][] {
  const workbook = XLSX.read(file, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
}

function parseRows(rows: unknown[][]): { parsed: ParsedRow[]; errors: ImportError[] } {
  if (rows.length === 0) {
    return { parsed: [], errors: [] };
  }

  const [rawHeaders, ...dataRows] = rows;
  const headers = rawHeaders.map((header) => normalizeHeader(String(header)));
  const parsed: ParsedRow[] = [];
  const errors: ImportError[] = [];

  dataRows.forEach((row, index) => {
    const cells = row as unknown[];
    const getCell = (name: string) => {
      const headerIndex = headers.indexOf(name);
      return headerIndex >= 0 ? cells[headerIndex] : "";
    };

    const rowNumber = index + 2;
    const name = String(getCell("name") ?? "").trim();
    if (!name) {
      errors.push({ row: rowNumber, code: "MISSING_NAME" });
    }

    const categoryRaw = String(getCell("category") ?? "").trim();
    const category = categoryValues.find((value) => value === categoryRaw);
    if (!categoryRaw) {
      errors.push({ row: rowNumber, code: "MISSING_CATEGORY" });
    } else if (!category) {
      errors.push({ row: rowNumber, code: "INVALID_CATEGORY" });
    }

    const priceValue = parseNumber(getCell("price"));
    if (priceValue === null) {
      errors.push({ row: rowNumber, code: "INVALID_PRICE" });
    }

    const stockTrackedValue = parseBoolean(getCell("is_stock_tracked"));
    if (stockTrackedValue === null) {
      errors.push({ row: rowNumber, code: "INVALID_STOCK_TRACKED" });
    }

    const stockValue = parseNumber(getCell("stock"));
    if (stockValue !== null && (!Number.isInteger(stockValue) || stockValue < 0)) {
      errors.push({ row: rowNumber, code: "INVALID_STOCK" });
    }

    parsed.push({
      productId: String(getCell("product_id") ?? "").trim() || undefined,
      name: name || undefined,
      category: category ?? undefined,
      price: priceValue ?? undefined,
      isStockTracked: stockTrackedValue ?? undefined,
      stock: stockValue ?? undefined,
      game: String(getCell("game") ?? "").trim() || undefined,
      expansion: String(getCell("expansion") ?? "").trim() || undefined,
      rarity: String(getCell("rarity") ?? "").trim() || undefined,
      condition: String(getCell("condition") ?? "").trim() || undefined,
      imageUrl: String(getCell("image_url") ?? "").trim() || undefined
    });
  });

  return { parsed, errors };
}

function reconcileStock(
  inventory: InventoryState,
  product: Product,
  desiredStock: number | undefined
): InventoryState {
  if (!product.isStockTracked) {
    return inventory;
  }
  if (desiredStock === undefined || !Number.isInteger(desiredStock)) {
    return inventory;
  }

  const current = getAvailableStock(inventory, product) ?? 0;
  if (desiredStock > current) {
    return increaseStock(inventory, product, desiredStock - current);
  }
  if (desiredStock < current) {
    return decreaseStock(inventory, product, current - desiredStock);
  }
  return inventory;
}

// Parses the workbook and reconciles products and inventory using core domain logic.
// This function can be reused for future Drive sync imports without changing behavior.
export function importProductsFromExcel(params: ImportParams): ImportResult {
  const rows = readRows(params.file);
  const { parsed, errors } = parseRows(rows);

  let inventory = params.inventory ?? createInventoryState();
  const products = [...params.products];
  let created = 0;
  let updated = 0;

  parsed.forEach((row, index) => {
    if (!row.name || !row.category || row.price === undefined || row.isStockTracked === undefined) {
      return;
    }

    const rowNumber = index + 2;
    // Prices in Excel are MXN units; convert to integer cents for domain Money.
    const price = createMoney(Math.round(row.price * 100));
    const tcg = row.game || row.expansion || row.rarity || row.condition || row.imageUrl
      ? {
          game: row.game,
          expansion: row.expansion,
          rarity: row.rarity,
          condition: row.condition,
          imageUrl: row.imageUrl
        }
      : undefined;

    if (row.productId) {
      const existingIndex = products.findIndex((product) => product.id === row.productId);
      if (existingIndex === -1) {
        const newProduct: Product = {
          id: row.productId,
          name: row.name,
          category: row.category,
          price,
          isStockTracked: row.isStockTracked,
          createdAt: params.nowIso,
          updatedAt: params.nowIso,
          tcg
        };

        products.push(newProduct);
        inventory = reconcileStock(inventory, newProduct, row.stock);
        created += 1;
        return;
      }

      const existing = products[existingIndex];
      const updatedProduct: Product = {
        ...existing,
        name: row.name,
        category: row.category,
        price,
        isStockTracked: row.isStockTracked,
        updatedAt: params.nowIso,
        tcg
      };

      products[existingIndex] = updatedProduct;
      inventory = reconcileStock(inventory, updatedProduct, row.stock);
      updated += 1;
      return;
    }

    const newProduct: Product = {
      id: params.createId(),
      name: row.name,
      category: row.category,
      price,
      isStockTracked: row.isStockTracked,
      createdAt: params.nowIso,
      updatedAt: params.nowIso,
      tcg
    };

    products.push(newProduct);
    inventory = reconcileStock(inventory, newProduct, row.stock);
    created += 1;
  });

  return {
    products,
    inventory,
    summary: {
      created,
      updated,
      errors
    }
  };
}
