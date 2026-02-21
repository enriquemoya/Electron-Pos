import { ApiErrors } from "../errors/api-error";

export function validateInventoryAdjustment(payload: unknown) {
  const delta = Number((payload as { delta?: unknown })?.delta);
  const reason = String((payload as { reason?: string })?.reason ?? "").trim();

  if (!Number.isFinite(delta) || Number.isNaN(delta)) {
    throw ApiErrors.inventoryInvalid;
  }

  if (!Number.isInteger(delta)) {
    throw ApiErrors.inventoryInvalid;
  }

  if (!reason) {
    throw ApiErrors.inventoryInvalid;
  }

  return { delta, reason };
}

export function validateInventoryMovementPayload(
  payload: unknown,
  options: { requireIdempotency?: boolean } = { requireIdempotency: true }
) {
  const base = validateInventoryAdjustment(payload);
  const productId = String((payload as { productId?: unknown })?.productId ?? "").trim();
  const idempotencyKey = String((payload as { idempotencyKey?: unknown })?.idempotencyKey ?? "").trim();

  if (!productId) {
    throw ApiErrors.inventoryInvalid;
  }
  if (options.requireIdempotency !== false && !idempotencyKey) {
    throw ApiErrors.inventoryInvalid;
  }

  return {
    productId,
    delta: base.delta,
    reason: base.reason,
    idempotencyKey
  };
}
