import type { Money } from "./money";
import { addMoney, createMoney } from "./money";
import type { Sale } from "./sale";

export type ShiftStatus = "OPEN" | "CLOSED";

export type Shift = {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openingAmount: Money;
  expectedAmount: Money;
  realAmount: Money | null;
  difference: Money | null;
  status: ShiftStatus;
};

// Sum opening cash with totals from the provided sales list.
export function calculateExpectedAmount(openingAmount: Money, sales: Sale[]): Money {
  return sales.reduce((total, sale) => addMoney(total, sale.total), openingAmount);
}

export function openShift(openingAmount: Money, id?: string, openedAt?: string): Shift {
  if (!id || !openedAt) {
    throw new Error("Shift id and openedAt are required.");
  }

  return {
    id,
    openedAt,
    closedAt: null,
    openingAmount,
    expectedAmount: openingAmount,
    realAmount: null,
    difference: null,
    status: "OPEN"
  };
}

export function closeShift(
  shift: Shift,
  realAmount: Money,
  sales: Sale[],
  closedAt?: string
): Shift {
  if (shift.status !== "OPEN") {
    throw new Error("Shift must be open to close.");
  }

  if (!closedAt) {
    throw new Error("Shift closedAt is required.");
  }

  if (shift.openingAmount.currency !== realAmount.currency) {
    throw new Error("Currency mismatch.");
  }

  const expectedAmount = calculateExpectedAmount(shift.openingAmount, sales);
  const difference = createMoney(realAmount.amount - expectedAmount.amount, realAmount.currency);

  return {
    ...shift,
    closedAt,
    expectedAmount,
    realAmount,
    difference,
    status: "CLOSED"
  };
}
