export function isIsoString(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

export function parsePage(value: unknown, fallback: number) {
  const parsed = Number(value ?? fallback);
  return parsed;
}

export function isPositiveNumber(value: number) {
  return Number.isFinite(value) && value > 0;
}
