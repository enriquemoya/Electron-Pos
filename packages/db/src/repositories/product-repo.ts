import type { DbHandle } from "../db";
import type { Product } from "@pos/core";

type ProductRow = {
  id: string;
  name: string;
  category: Product["category"];
  price_amount: number;
  price_currency: "MXN";
  game_type_id: string | null;
  expansion_id: string | null;
  game: string | null;
  expansion: string | null;
  rarity: string | null;
  condition: string | null;
  image_url: string | null;
  is_stock_tracked: number;
  created_at: string;
  updated_at: string;
};

function mapRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: {
      amount: row.price_amount,
      currency: row.price_currency
    },
    isStockTracked: row.is_stock_tracked === 1,
    gameTypeId: row.game_type_id ?? null,
    expansionId: row.expansion_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tcg: row.game || row.expansion || row.rarity || row.condition || row.image_url
      ? {
          game: row.game ?? undefined,
          expansion: row.expansion ?? undefined,
          rarity: row.rarity ?? undefined,
          condition: row.condition ?? undefined,
          imageUrl: row.image_url ?? undefined
        }
      : undefined
  };
}

export function createProductRepository(db: DbHandle) {
  const insertStmt = db.prepare(`
    INSERT INTO products (
      id,
      name,
      category,
      price_amount,
      price_currency,
      game_type_id,
      expansion_id,
      game,
      expansion,
      rarity,
      condition,
      image_url,
      is_stock_tracked,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE products SET
      name = ?,
      category = ?,
      price_amount = ?,
      price_currency = ?,
      game_type_id = ?,
      expansion_id = ?,
      game = ?,
      expansion = ?,
      rarity = ?,
      condition = ?,
      image_url = ?,
      is_stock_tracked = ?,
      updated_at = ?
    WHERE id = ?
  `);

  return {
    getById(id: string): Product | null {
      const row = db.prepare(
        "SELECT * FROM products WHERE id = ? AND enabled_pos = 1 AND is_deleted_cloud = 0"
      ).get(id) as
        | ProductRow
        | undefined;
      return row ? mapRowToProduct(row) : null;
    },
    list(): Product[] {
      const rows = db
        .prepare(
          "SELECT * FROM products WHERE enabled_pos = 1 AND is_deleted_cloud = 0 ORDER BY name ASC"
        )
        .all() as ProductRow[];
      return rows.map(mapRowToProduct);
    },
    listRecent(limit: number): Product[] {
      const rows = db
        .prepare(
          "SELECT * FROM products WHERE enabled_pos = 1 AND is_deleted_cloud = 0 ORDER BY created_at DESC LIMIT ?"
        )
        .all(limit) as ProductRow[];
      return rows.map(mapRowToProduct);
    },
    listTop(limit: number): Product[] {
      const rows = db
        .prepare(
          `
          SELECT p.*
          FROM products p
          INNER JOIN sale_items si ON si.product_id = p.id
          WHERE p.enabled_pos = 1 AND p.is_deleted_cloud = 0
          GROUP BY p.id
          ORDER BY SUM(si.quantity) DESC
          LIMIT ?
          `
        )
        .all(limit) as ProductRow[];
      return rows.map(mapRowToProduct);
    },
    create(product: Product) {
      insertStmt.run(
        product.id,
        product.name,
        product.category,
        product.price.amount,
        product.price.currency,
        product.gameTypeId ?? null,
        product.expansionId ?? null,
        product.tcg?.game ?? null,
        product.tcg?.expansion ?? null,
        product.tcg?.rarity ?? null,
        product.tcg?.condition ?? null,
        product.tcg?.imageUrl ?? null,
        product.isStockTracked ? 1 : 0,
        product.createdAt,
        product.updatedAt
      );
    },
    update(product: Product) {
      updateStmt.run(
        product.name,
        product.category,
        product.price.amount,
        product.price.currency,
        product.gameTypeId ?? null,
        product.expansionId ?? null,
        product.tcg?.game ?? null,
        product.tcg?.expansion ?? null,
        product.tcg?.rarity ?? null,
        product.tcg?.condition ?? null,
        product.tcg?.imageUrl ?? null,
        product.isStockTracked ? 1 : 0,
        product.updatedAt,
        product.id
      );
    },
    delete(id: string) {
      db.prepare("DELETE FROM products WHERE id = ?").run(id);
    },
    listPaged(filters: {
      search?: string;
      category?: Product["category"];
      gameTypeId?: string;
      stockStatus?: "NORMAL" | "LOW" | "OUT";
      sortBy?: "NAME" | "CREATED_AT" | "STOCK";
      sortDir?: "ASC" | "DESC";
      page?: number;
      pageSize?: number;
    }): { items: { product: Product; stock: number | null; stockStatus: "NORMAL" | "LOW" | "OUT" }[]; total: number; page: number; pageSize: number } {
      const conditions: string[] = [];
      const values: (string | number)[] = [];

      if (filters.search) {
        conditions.push("LOWER(p.name) LIKE ?");
        values.push(`%${filters.search.toLowerCase()}%`);
      }
      if (filters.category) {
        conditions.push("p.category = ?");
        values.push(filters.category);
      }
      if (filters.gameTypeId) {
        conditions.push("p.game_type_id = ?");
        values.push(filters.gameTypeId);
      }

      if (filters.stockStatus === "OUT") {
        conditions.push("p.is_stock_tracked = 1 AND COALESCE(i.stock, 0) <= 0");
      } else if (filters.stockStatus === "LOW") {
        conditions.push(
          "p.is_stock_tracked = 1 AND COALESCE(i.stock, 0) > 0 AND COALESCE(i.stock, 0) <= COALESCE(s.min_stock, 0)"
        );
      } else if (filters.stockStatus === "NORMAL") {
        conditions.push(
          "(p.is_stock_tracked = 0 OR COALESCE(i.stock, 0) > COALESCE(s.min_stock, 0))"
        );
      }

      const baseConditions = ["p.enabled_pos = 1", "p.is_deleted_cloud = 0"];
      const whereClause = [...baseConditions, ...conditions].length
        ? `WHERE ${[...baseConditions, ...conditions].join(" AND ")}`
        : "";

      const sortBy = filters.sortBy ?? "CREATED_AT";
      const sortDir = filters.sortDir === "ASC" ? "ASC" : "DESC";
      const sortColumn =
        sortBy === "NAME"
          ? "p.name"
          : sortBy === "STOCK"
            ? "COALESCE(i.stock, 0)"
            : "p.created_at";

      const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 20));
      const page = Math.max(1, filters.page ?? 1);
      const offset = (page - 1) * pageSize;

      const totalRow = db
        .prepare(
          `
          SELECT COUNT(*) as total
          FROM products p
          LEFT JOIN inventory i ON i.product_id = p.id
          LEFT JOIN product_alert_settings s ON s.product_id = p.id
          ${whereClause}
          `
        )
        .get(...values) as { total: number };

      const rows = db
        .prepare(
          `
          SELECT
            p.*,
            i.stock as stock,
            s.min_stock as min_stock,
            CASE
              WHEN p.is_stock_tracked = 0 THEN 'NORMAL'
              WHEN COALESCE(i.stock, 0) <= 0 THEN 'OUT'
              WHEN COALESCE(i.stock, 0) <= COALESCE(s.min_stock, 0) THEN 'LOW'
              ELSE 'NORMAL'
            END as stock_status
          FROM products p
          LEFT JOIN inventory i ON i.product_id = p.id
          LEFT JOIN product_alert_settings s ON s.product_id = p.id
          ${whereClause}
          ORDER BY ${sortColumn} ${sortDir}
          LIMIT ? OFFSET ?
          `
        )
        .all(...values, pageSize, offset) as (ProductRow & {
        stock: number | null;
        min_stock: number | null;
        stock_status: "NORMAL" | "LOW" | "OUT";
      })[];

      const items = rows.map((row) => ({
        product: mapRowToProduct(row),
        stock: row.stock ?? null,
        stockStatus: row.stock_status
      }));

      return { items, total: totalRow?.total ?? 0, page, pageSize };
    }
  };
}
