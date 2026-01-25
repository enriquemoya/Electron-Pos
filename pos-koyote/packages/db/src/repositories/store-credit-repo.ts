import type { DbHandle } from "../db";
import type { StoreCreditMovement } from "@pos/core";

type MovementRow = {
  id: string;
  customer_id: string;
  amount: number;
  reason: StoreCreditMovement["reason"];
  reference_type: StoreCreditMovement["referenceType"];
  reference_id: string | null;
  created_at: string;
};

function mapRow(row: MovementRow): StoreCreditMovement {
  return {
    id: row.id,
    customerId: row.customer_id,
    amount: { amount: row.amount, currency: "MXN" },
    reason: row.reason,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    createdAt: row.created_at
  };
}

export function createStoreCreditRepository(db: DbHandle) {
  const insertStmt = db.prepare(`
    INSERT INTO store_credit_movements (
      id,
      customer_id,
      amount,
      reason,
      reference_type,
      reference_id,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const listStmt = db.prepare(
    "SELECT * FROM store_credit_movements WHERE customer_id = ? ORDER BY created_at DESC"
  );

  const balanceStmt = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as balance FROM store_credit_movements WHERE customer_id = ?"
  );

  return {
    addMovement(movement: StoreCreditMovement): StoreCreditMovement {
      insertStmt.run(
        movement.id,
        movement.customerId,
        movement.amount.amount,
        movement.reason,
        movement.referenceType,
        movement.referenceId ?? null,
        movement.createdAt
      );
      return movement;
    },
    listMovements(customerId: string): StoreCreditMovement[] {
      const rows = listStmt.all(customerId) as MovementRow[];
      return rows.map(mapRow);
    },
    getBalance(customerId: string): { amount: number; currency: "MXN" } {
      const row = balanceStmt.get(customerId) as { balance: number } | undefined;
      return { amount: row?.balance ?? 0, currency: "MXN" };
    },
    getSummaryByDate(from: string, to: string): { granted: number; used: number } {
      const row = db
        .prepare(
          `SELECT
             COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as granted,
             COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as used
           FROM store_credit_movements
           WHERE created_at >= ? AND created_at <= ?`
        )
        .get(from, to) as { granted: number; used: number };
      return {
        granted: row?.granted ?? 0,
        used: Math.abs(row?.used ?? 0)
      };
    }
  };
}
