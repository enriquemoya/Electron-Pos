import type { DbHandle } from "../db";

export type InventoryMovement = {
  id: string;
  productId: string;
  delta: number;
  source: string;
  referenceType?: string | null;
  referenceId?: string | null;
  flagged: boolean;
  createdAt: string;
};

export function createInventoryMovementRepository(db: DbHandle) {
  const insertStmt = db.prepare(`
    INSERT INTO inventory_movements (
      id,
      product_id,
      delta,
      source,
      reference_type,
      reference_id,
      flagged,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return {
    addMovement(movement: InventoryMovement) {
      insertStmt.run(
        movement.id,
        movement.productId,
        movement.delta,
        movement.source,
        movement.referenceType ?? null,
        movement.referenceId ?? null,
        movement.flagged ? 1 : 0,
        movement.createdAt
      );
      return movement;
    }
  };
}
