import { OnlineOrderStatus } from "@prisma/client";

const STATUS_VALUES = new Set<string>(Object.values(OnlineOrderStatus));

export const LEGACY_STATUS_ALIAS: Record<string, OnlineOrderStatus> = {
  CANCELED: OnlineOrderStatus.CANCELLED_MANUAL
};

export const FEATURE_DISABLED_TRANSITION_TARGETS = new Set<OnlineOrderStatus>([
  OnlineOrderStatus.SHIPPED
]);

export const ORDER_STATUS_TRANSITIONS: Record<OnlineOrderStatus, readonly OnlineOrderStatus[]> = {
  [OnlineOrderStatus.CREATED]: [OnlineOrderStatus.PENDING_PAYMENT, OnlineOrderStatus.PAID],
  [OnlineOrderStatus.PENDING_PAYMENT]: [
    OnlineOrderStatus.PAID_BY_TRANSFER,
    OnlineOrderStatus.PAID,
    OnlineOrderStatus.CANCELLED_EXPIRED,
    OnlineOrderStatus.CANCELLED_MANUAL
  ],
  [OnlineOrderStatus.PAID_BY_TRANSFER]: [OnlineOrderStatus.READY_FOR_PICKUP, OnlineOrderStatus.CANCELLED_MANUAL],
  [OnlineOrderStatus.PAID]: [OnlineOrderStatus.READY_FOR_PICKUP, OnlineOrderStatus.CANCELLED_MANUAL],
  [OnlineOrderStatus.READY_FOR_PICKUP]: [OnlineOrderStatus.COMPLETED, OnlineOrderStatus.CANCELLED_MANUAL],
  [OnlineOrderStatus.COMPLETED]: [],
  [OnlineOrderStatus.SHIPPED]: [],
  [OnlineOrderStatus.CANCELED]: [],
  [OnlineOrderStatus.CANCELLED_EXPIRED]: [],
  [OnlineOrderStatus.CANCELLED_MANUAL]: [],
  [OnlineOrderStatus.CANCELLED_REFUNDED]: []
};

export function normalizeOnlineOrderStatus(value: string): OnlineOrderStatus | null {
  const upper = value.trim().toUpperCase();
  const alias = LEGACY_STATUS_ALIAS[upper];
  if (alias) {
    return alias;
  }
  return STATUS_VALUES.has(upper) ? (upper as OnlineOrderStatus) : null;
}

export function toApiStatus(value: OnlineOrderStatus): string {
  if (value === OnlineOrderStatus.CANCELED) {
    return OnlineOrderStatus.CANCELLED_MANUAL;
  }
  return value;
}
