import { Money, addMoney, createMoney } from "./money";
import { deriveProofStatus, requiresProof, PaymentMethod, PaymentProofStatus } from "./payment";
import { SaleItem } from "./sale-item";

export type Sale = {
  id: string;
  shiftId: string;
  tournamentId?: string | null;
  customerId?: string | null;
  paymentMethod: PaymentMethod;
  paymentAmount: Money;
  paymentReference?: string | null;
  proofFileRef?: string | null;
  proofStatus: PaymentProofStatus;
  items: SaleItem[];
  total: Money;
  createdAt: string;
};

// Create a new sale with no items and zero total.
export function createEmptySale(id: string, shiftId: string, createdAt: string): Sale {
  const paymentMethod: PaymentMethod = "EFECTIVO";
  const paymentAmount = createMoney(0);
  const proofStatus = deriveProofStatus(paymentMethod, true);
  return {
    id,
    shiftId,
    tournamentId: null,
    customerId: null,
    paymentMethod,
    paymentAmount,
    paymentReference: null,
    proofFileRef: null,
    proofStatus,
    items: [],
    total: createMoney(0),
    createdAt
  };
}

// Sum item totals into a single money value.
export function calculateSaleTotal(items: SaleItem[]): Money {
  return items.reduce((total, item) => addMoney(total, item.lineTotal), createMoney(0));
}
