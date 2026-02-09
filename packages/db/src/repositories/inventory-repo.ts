import type { DbHandle } from "../db";
import type { InventoryState } from "@pos/core";

type InventoryRow = {
  product_id: string;
  stock: number;
  updated_at: string;
};

export function createInventoryRepository(db: DbHandle) {
  const upsertStmt = db.prepare(`
    INSERT INTO inventory (product_id, stock, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(product_id) DO UPDATE SET
      stock = excluded.stock,
      updated_at = excluded.updated_at
  `);

  return {
    getByProductId(productId: string): InventoryRow | null {
      const row = db.prepare("SELECT * FROM inventory WHERE product_id = ?").get(productId) as
        | InventoryRow
        | undefined;
      return row ?? null;
    },
    loadState(): InventoryState {
      const rows = db.prepare("SELECT * FROM inventory").all() as InventoryRow[];
      const items: InventoryState["items"] = {};
      rows.forEach((row) => {
        items[row.product_id] = { productId: row.product_id, quantity: row.stock };
      });
      return { items };
    },
    setStock(productId: string, stock: number, updatedAt: string) {
      upsertStmt.run(productId, stock, updatedAt);
    },
    remove(productId: string) {
      db.prepare("DELETE FROM inventory WHERE product_id = ?").run(productId);
    }
  };
}
