import type { DbHandle } from "../db";
import type { InventoryAlert, InventoryAlertType } from "@pos/core";

type AlertRow = {
  id: string;
  product_id: string;
  type: string;
  current_stock: number;
  threshold: number;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

function mapRow(row: AlertRow): InventoryAlert {
  return {
    id: row.id,
    productId: row.product_id,
    type: row.type as InventoryAlertType,
    currentStock: row.current_stock,
    threshold: row.threshold,
    status: row.status as InventoryAlert["status"],
    createdAt: row.created_at,
    resolvedAt: row.resolved_at
  };
}

export function createInventoryAlertRepository(db: DbHandle) {
  const insertStmt = db.prepare(
    `INSERT INTO inventory_alerts (
        id,
        product_id,
        type,
        current_stock,
        threshold,
        status,
        created_at,
        resolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const updateActiveStmt = db.prepare(
    `UPDATE inventory_alerts
     SET current_stock = ?, threshold = ?
     WHERE id = ?`
  );
  const resolveStmt = db.prepare(
    `UPDATE inventory_alerts
     SET status = 'RESOLVED', resolved_at = ?
     WHERE id = ?`
  );
  const resolveByProductStmt = db.prepare(
    `UPDATE inventory_alerts
     SET status = 'RESOLVED', resolved_at = ?
     WHERE product_id = ? AND status = 'ACTIVE'`
  );
  const resolveByProductTypeStmt = db.prepare(
    `UPDATE inventory_alerts
     SET status = 'RESOLVED', resolved_at = ?
     WHERE product_id = ? AND type = ? AND status = 'ACTIVE'`
  );
  const selectActiveByProductTypeStmt = db.prepare(
    `SELECT * FROM inventory_alerts
     WHERE product_id = ? AND type = ? AND status = 'ACTIVE'
     LIMIT 1`
  );
  const listActiveStmt = db.prepare(
    `SELECT * FROM inventory_alerts
     WHERE status = 'ACTIVE'
     ORDER BY created_at DESC`
  );
  const listActiveByTypeStmt = db.prepare(
    `SELECT * FROM inventory_alerts
     WHERE status = 'ACTIVE' AND type = ?
     ORDER BY created_at DESC`
  );
  const listByProductStmt = db.prepare(
    `SELECT * FROM inventory_alerts
     WHERE product_id = ?
     ORDER BY created_at DESC`
  );

  return {
    createAlert(alert: InventoryAlert) {
      insertStmt.run(
        alert.id,
        alert.productId,
        alert.type,
        alert.currentStock,
        alert.threshold,
        alert.status,
        alert.createdAt,
        alert.resolvedAt ?? null
      );
      return alert;
    },
    updateActiveAlert(id: string, currentStock: number, threshold: number) {
      updateActiveStmt.run(currentStock, threshold, id);
    },
    resolveAlert(id: string, resolvedAt: string) {
      resolveStmt.run(resolvedAt, id);
    },
    resolveActiveByProduct(productId: string, resolvedAt: string) {
      resolveByProductStmt.run(resolvedAt, productId);
    },
    resolveActiveByProductAndType(
      productId: string,
      type: InventoryAlertType,
      resolvedAt: string
    ) {
      resolveByProductTypeStmt.run(resolvedAt, productId, type);
    },
    getActiveByProductAndType(productId: string, type: InventoryAlertType) {
      const row = selectActiveByProductTypeStmt.get(productId, type) as AlertRow | undefined;
      return row ? mapRow(row) : null;
    },
    getActiveAlerts(type?: InventoryAlertType) {
      const rows = (
        type ? listActiveByTypeStmt.all(type) : listActiveStmt.all()
      ) as AlertRow[];
      return rows.map(mapRow);
    },
    getAlertsByProduct(productId: string) {
      const rows = listByProductStmt.all(productId) as AlertRow[];
      return rows.map(mapRow);
    }
  };
}
