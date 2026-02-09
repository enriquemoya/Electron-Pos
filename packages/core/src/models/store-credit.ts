import type { Money } from "./money";

export type StoreCreditMovement = {
  id: string;
  customerId: string;
  amount: Money;
  reason: "TORNEO" | "EVENTO" | "MANUAL" | "VENTA";
  referenceType: "SALE" | "TOURNAMENT" | "EVENT" | "MANUAL";
  referenceId?: string | null;
  createdAt: string;
};

export function calculateCreditBalance(movements: StoreCreditMovement[]): Money {
  return movements.reduce(
    (total, movement) => ({
      amount: total.amount + movement.amount.amount,
      currency: total.currency
    }),
    { amount: 0, currency: "MXN" }
  );
}
