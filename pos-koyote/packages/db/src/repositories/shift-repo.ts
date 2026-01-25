import type { DbHandle } from "../db";
import type { Shift } from "@pos/core";

type ShiftRow = {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opening_amount: number;
  expected_amount: number;
  real_amount: number | null;
  difference: number | null;
  status: "OPEN" | "CLOSED";
};

function mapShiftRow(row: ShiftRow): Shift {
  return {
    id: row.id,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    openingAmount: { amount: row.opening_amount, currency: "MXN" },
    expectedAmount: { amount: row.expected_amount, currency: "MXN" },
    realAmount: row.real_amount === null ? null : { amount: row.real_amount, currency: "MXN" },
    difference: row.difference === null ? null : { amount: row.difference, currency: "MXN" },
    status: row.status
  };
}

export function createShiftRepository(db: DbHandle) {
  const insertShift = db.prepare(`
    INSERT INTO shifts (
      id,
      opened_at,
      closed_at,
      opening_amount,
      expected_amount,
      real_amount,
      difference,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return {
    open(shift: Shift) {
      const active = db.prepare("SELECT id FROM shifts WHERE status = 'OPEN' LIMIT 1").get() as
        | { id: string }
        | undefined;
      if (active) {
        throw new Error("Shift already open.");
      }
      insertShift.run(
        shift.id,
        shift.openedAt,
        shift.closedAt,
        shift.openingAmount.amount,
        shift.expectedAmount.amount,
        shift.realAmount?.amount ?? null,
        shift.difference?.amount ?? null,
        shift.status
      );
    },
    getActive(): Shift | null {
      const row = db.prepare("SELECT * FROM shifts WHERE status = 'OPEN' LIMIT 1").get() as
        | ShiftRow
        | undefined;
      return row ? mapShiftRow(row) : null;
    },
    close(shift: Shift) {
      const current = db
        .prepare("SELECT status FROM shifts WHERE id = ?")
        .get(shift.id) as { status: "OPEN" | "CLOSED" } | undefined;
      if (!current) {
        throw new Error("Shift not found.");
      }
      if (current.status !== "OPEN") {
        throw new Error("Shift already closed.");
      }

      db.prepare(
        "UPDATE shifts SET closed_at = ?, expected_amount = ?, real_amount = ?, difference = ?, status = ? WHERE id = ?"
      ).run(
        shift.closedAt,
        shift.expectedAmount.amount,
        shift.realAmount?.amount ?? null,
        shift.difference?.amount ?? null,
        shift.status,
        shift.id
      );
    },
    listHistory(): Shift[] {
      const rows = db
        .prepare("SELECT * FROM shifts WHERE status = 'CLOSED' ORDER BY closed_at DESC")
        .all() as ShiftRow[];
      return rows.map(mapShiftRow);
    },
    listByDate(from: string, to: string): Shift[] {
      const rows = db
        .prepare("SELECT * FROM shifts WHERE opened_at >= ? AND opened_at <= ? ORDER BY opened_at ASC")
        .all(from, to) as ShiftRow[];
      return rows.map(mapShiftRow);
    },
    incrementExpectedAmount(shiftId: string, delta: number) {
      db.prepare("UPDATE shifts SET expected_amount = expected_amount + ? WHERE id = ?")
        .run(delta, shiftId);
    }
  };
}
