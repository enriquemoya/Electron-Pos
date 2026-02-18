import { ApiErrors } from "../errors/api-error";
import { normalizeOnlineOrderStatus } from "../domain/order-status";

const PAGE_SIZE_VALUES = new Set([20, 50, 100]);
const ORDER_SORT_VALUES = new Set(["createdAt", "status", "expiresAt", "subtotal"]);
const ORDER_DIRECTION_VALUES = new Set(["asc", "desc"]);
const REFUND_METHOD_VALUES = new Set(["CASH", "CARD", "STORE_CREDIT", "TRANSFER", "OTHER"]);

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    return fallback;
  }
  return parsed;
}

export function validateOrderListQuery(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const pageSize = parsePositiveInt(query.pageSize, 20);
  if (!PAGE_SIZE_VALUES.has(pageSize)) {
    throw ApiErrors.adminPaginationInvalid;
  }

  const statusRaw = typeof query.status === "string" ? query.status.trim().toUpperCase() : undefined;
  if (statusRaw && !normalizeOnlineOrderStatus(statusRaw)) {
    throw ApiErrors.orderStatusInvalid;
  }

  const search = typeof query.q === "string" ? query.q.trim() : "";
  const sortRaw = typeof query.sort === "string" ? query.sort.trim() : "";
  const directionRaw = typeof query.direction === "string" ? query.direction.trim().toLowerCase() : "";
  if (sortRaw && !ORDER_SORT_VALUES.has(sortRaw)) {
    throw ApiErrors.invalidRequest;
  }
  if (directionRaw && !ORDER_DIRECTION_VALUES.has(directionRaw)) {
    throw ApiErrors.invalidRequest;
  }
  return {
    page,
    pageSize,
    status: statusRaw || undefined,
    query: search || undefined,
    sort: (sortRaw || undefined) as "createdAt" | "status" | "expiresAt" | "subtotal" | undefined,
    direction: (directionRaw || undefined) as "asc" | "desc" | undefined
  };
}

export function validateTransitionBody(payload: unknown) {
  const toStatusRaw = String((payload as { toStatus?: unknown })?.toStatus ?? "");
  const toStatus = normalizeOnlineOrderStatus(toStatusRaw);
  if (!toStatus) {
    throw ApiErrors.orderStatusInvalid;
  }

  const reasonRaw = (payload as { reason?: unknown })?.reason;
  const reason = reasonRaw === undefined || reasonRaw === null ? null : String(reasonRaw).trim();
  const adminMessageRaw = (payload as { adminMessage?: unknown })?.adminMessage;
  const adminMessage =
    adminMessageRaw === undefined || adminMessageRaw === null ? null : String(adminMessageRaw).trim();
  return {
    toStatus: toStatus,
    reason: reason || null,
    adminMessage: adminMessage || null
  };
}

export function validateRefundBody(payload: unknown) {
  const orderItemIdRaw = (payload as { orderItemId?: unknown })?.orderItemId;
  const orderItemId = orderItemIdRaw === undefined || orderItemIdRaw === null ? null : String(orderItemIdRaw).trim();

  const amountRaw = Number((payload as { amount?: unknown })?.amount);
  if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
    throw ApiErrors.refundInvalidAmount;
  }

  const refundMethodRaw = String((payload as { refundMethod?: unknown })?.refundMethod ?? "").trim().toUpperCase();
  if (!REFUND_METHOD_VALUES.has(refundMethodRaw)) {
    throw ApiErrors.invalidRequest;
  }

  const adminMessageRaw = String((payload as { adminMessage?: unknown })?.adminMessage ?? "").trim();
  if (!adminMessageRaw) {
    throw ApiErrors.refundMessageRequired;
  }

  return {
    orderItemId: orderItemId || null,
    amount: amountRaw,
    refundMethod: refundMethodRaw as "CASH" | "CARD" | "STORE_CREDIT" | "TRANSFER" | "OTHER",
    adminMessage: adminMessageRaw
  };
}
