import type { DbHandle } from "../db";
import type { ProductAlertSettings } from "@pos/core";

type SettingsRow = {
  product_id: string;
  min_stock: number;
  alerts_enabled: number;
  out_of_stock_enabled: number;
  updated_at: string;
};

function mapRow(row: SettingsRow): ProductAlertSettings {
  return {
    productId: row.product_id,
    minStock: row.min_stock,
    alertsEnabled: row.alerts_enabled === 1,
    outOfStockEnabled: row.out_of_stock_enabled === 1,
    updatedAt: row.updated_at
  };
}

export function createProductAlertRepository(db: DbHandle) {
  const selectStmt = db.prepare(
    "SELECT * FROM product_alert_settings WHERE product_id = ?"
  );
  const upsertStmt = db.prepare(
    `INSERT INTO product_alert_settings (
        product_id,
        min_stock,
        alerts_enabled,
        out_of_stock_enabled,
        updated_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(product_id) DO UPDATE SET
        min_stock = excluded.min_stock,
        alerts_enabled = excluded.alerts_enabled,
        out_of_stock_enabled = excluded.out_of_stock_enabled,
        updated_at = excluded.updated_at`
  );

  return {
    getSettings(productId: string): ProductAlertSettings {
      const row = selectStmt.get(productId) as SettingsRow | undefined;
      if (!row) {
        return {
          productId,
          minStock: 0,
          alertsEnabled: false,
          outOfStockEnabled: false,
          updatedAt: new Date().toISOString()
        };
      }
      return mapRow(row);
    },
    updateSettings(settings: ProductAlertSettings): ProductAlertSettings {
      upsertStmt.run(
        settings.productId,
        settings.minStock,
        settings.alertsEnabled ? 1 : 0,
        settings.outOfStockEnabled ? 1 : 0,
        settings.updatedAt
      );
      return settings;
    }
  };
}
