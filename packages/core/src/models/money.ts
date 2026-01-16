export type Money = {
  amount: number;
  currency: "MXN";
};

const DEFAULT_CURRENCY: Money["currency"] = "MXN";

// Ensure the amount uses smallest currency units.
function assertInteger(value: number, label: string) {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer.`);
  }
}

// Currency is fixed to MXN for now.
function assertCurrency(currency: Money["currency"]) {
  if (currency !== DEFAULT_CURRENCY) {
    throw new Error("Unsupported currency.");
  }
}

export function createMoney(amount: number, currency: Money["currency"] = DEFAULT_CURRENCY): Money {
  assertInteger(amount, "Amount");
  assertCurrency(currency);
  return { amount, currency };
}

export function addMoney(left: Money, right: Money): Money {
  if (left.currency !== right.currency) {
    throw new Error("Currency mismatch.");
  }
  return createMoney(left.amount + right.amount, left.currency);
}

export function multiplyMoney(money: Money, quantity: number): Money {
  assertInteger(quantity, "Quantity");
  return createMoney(money.amount * quantity, money.currency);
}
