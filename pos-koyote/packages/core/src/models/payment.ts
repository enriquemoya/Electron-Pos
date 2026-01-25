import type { Money } from "./money";

export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CREDITO_TIENDA";
export type PaymentProofStatus = "ATTACHED" | "PENDING";

export type PaymentValidationResult = {
  valid: boolean;
  errors: string[];
  proofRequired: boolean;
};

export function requiresProof(method: PaymentMethod): boolean {
  return method === "TRANSFERENCIA" || method === "TARJETA";
}

export function deriveProofStatus(method: PaymentMethod, proofUploaded: boolean): PaymentProofStatus {
  if (!requiresProof(method)) {
    return "ATTACHED";
  }
  return proofUploaded ? "ATTACHED" : "PENDING";
}

export function validatePayment(
  method: PaymentMethod | null | undefined,
  amount: Money,
  _proofProvided: boolean
): PaymentValidationResult {
  const errors: string[] = [];

  if (!method) {
    errors.push("PAYMENT_METHOD_REQUIRED");
  }

  if (amount.amount <= 0) {
    errors.push("PAYMENT_AMOUNT_INVALID");
  }

  const proofRequired = method ? requiresProof(method) : false;

  return {
    valid: errors.length === 0,
    errors,
    proofRequired
  };
}
