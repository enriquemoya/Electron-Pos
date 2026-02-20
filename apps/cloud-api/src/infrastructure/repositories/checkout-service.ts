import { OnlineOrderStatus, Prisma } from "@prisma/client";

import { prisma } from "../db/prisma";
import { appLogger } from "../../config/app-logger";
import { ApiErrors } from "../../errors/api-error";
import { normalizeOnlineOrderStatus, toApiStatus } from "../../domain/order-status";

const LOW_STOCK_THRESHOLD = 3;
const EXPIRATION_DAYS = 10;

type EntryMethod = "PAY_IN_STORE" | "BANK_TRANSFER" | "STORE_CREDIT" | "PROVIDER_EXTERNAL" | "REFUND";
type EntryStatus = "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED" | "VOIDED";
type LedgerState = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERPAID" | "FAILED" | "REFUNDED";
type RefundMethod = "CASH" | "CARD" | "STORE_CREDIT" | "TRANSFER" | "OTHER";

function mapPaymentMethodToEntryMethod(method: "PAY_IN_STORE" | "BANK_TRANSFER"): EntryMethod {
  return method === "BANK_TRANSFER" ? "BANK_TRANSFER" : "PAY_IN_STORE";
}

function toMoney(value: Prisma.Decimal | number) {
  return Number(value);
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function mapPaymentStatusToEntryStatus(status: "PENDING_TRANSFER" | "PAID" | "FAILED" | "REFUNDED"): EntryStatus {
  if (status === "PAID") {
    return "CONFIRMED";
  }
  if (status === "FAILED") {
    return "FAILED";
  }
  if (status === "REFUNDED") {
    return "REFUNDED";
  }
  return "PENDING";
}

function deriveLedgerState(params: {
  totalDue: number;
  confirmedPaid: number;
  failedCount: number;
  refundedCount: number;
  pendingCount: number;
}): LedgerState {
  const { totalDue, confirmedPaid, failedCount, refundedCount, pendingCount } = params;
  if (refundedCount > 0 && confirmedPaid <= 0) {
    return "REFUNDED";
  }
  if (failedCount > 0 && confirmedPaid <= 0 && pendingCount === 0) {
    return "FAILED";
  }
  if (confirmedPaid <= 0) {
    return "UNPAID";
  }
  if (confirmedPaid > totalDue) {
    return "OVERPAID";
  }
  if (confirmedPaid < totalDue) {
    return "PARTIALLY_PAID";
  }
  return "PAID";
}

function mapLedgerStateToCompatibilityStatus(
  state: LedgerState,
  fallback: "PENDING_TRANSFER" | "PAID" | "FAILED" | "REFUNDED"
) {
  if (state === "PAID" || state === "OVERPAID") {
    return "PAID" as const;
  }
  if (state === "FAILED") {
    return "FAILED" as const;
  }
  if (state === "REFUNDED") {
    return "REFUNDED" as const;
  }
  return fallback;
}

async function ensurePaymentLedger(tx: Prisma.TransactionClient, params: {
  orderId: string;
  subtotal: number;
  currency: string;
  paymentMethod: "PAY_IN_STORE" | "BANK_TRANSFER";
  paymentStatus: "PENDING_TRANSFER" | "PAID" | "FAILED" | "REFUNDED";
  createdAt: Date;
  updatedAt: Date;
}) {
  const totalDue = new Prisma.Decimal(params.subtotal);
  const totalPaid = params.paymentStatus === "PAID" ? totalDue : new Prisma.Decimal(0);
  const balanceDue = params.paymentStatus === "PAID" ? new Prisma.Decimal(0) : totalDue;
  const initialState: LedgerState =
    params.paymentStatus === "PAID"
      ? "PAID"
      : params.paymentStatus === "FAILED"
        ? "FAILED"
        : params.paymentStatus === "REFUNDED"
          ? "REFUNDED"
          : "UNPAID";

  const ledger = await tx.orderPaymentLedger.upsert({
    where: { orderId: params.orderId },
    create: {
      orderId: params.orderId,
      currency: params.currency,
      totalDue,
      totalPaid,
      balanceDue,
      state: initialState,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt
    },
    update: {},
    select: { id: true }
  });

  return ledger.id;
}

async function recomputePaymentLedger(tx: Prisma.TransactionClient, params: {
  orderId: string;
  fallbackPaymentStatus: "PENDING_TRANSFER" | "PAID" | "FAILED" | "REFUNDED";
}) {
  const ledger = await tx.orderPaymentLedger.findUnique({
    where: { orderId: params.orderId },
    select: {
      id: true,
      totalDue: true,
      entries: {
        select: {
          entryStatus: true,
          amount: true
        }
      }
    }
  });

  if (!ledger) {
    return;
  }

  let confirmedPaid = 0;
  let failedCount = 0;
  let refundedCount = 0;
  let pendingCount = 0;

  for (const entry of ledger.entries) {
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      if (entry.entryStatus === "FAILED") {
        failedCount += 1;
      } else if (entry.entryStatus === "REFUNDED") {
        refundedCount += 1;
      } else if (entry.entryStatus === "PENDING") {
        pendingCount += 1;
      }
      continue;
    }
    if (entry.entryStatus === "CONFIRMED") {
      confirmedPaid += amount;
      continue;
    }
    if (entry.entryStatus === "REFUNDED" || entry.entryStatus === "VOIDED") {
      confirmedPaid -= amount;
      refundedCount += 1;
      continue;
    }
    if (entry.entryStatus === "FAILED") {
      failedCount += 1;
      continue;
    }
    if (entry.entryStatus === "PENDING") {
      pendingCount += 1;
    }
  }

  const totalDue = Number(ledger.totalDue);
  if (ledger.entries.length === 0 && params.fallbackPaymentStatus === "PAID") {
    confirmedPaid = totalDue;
  }
  if (confirmedPaid > totalDue) {
    throw ApiErrors.paymentOverpayNotAllowed;
  }
  const safeConfirmed = Math.max(0, confirmedPaid);
  const balanceDue = Math.max(0, totalDue - safeConfirmed);
  const nextState = deriveLedgerState({
    totalDue,
    confirmedPaid: safeConfirmed,
    failedCount,
    refundedCount,
    pendingCount
  });
  const compatibilityStatus = mapLedgerStateToCompatibilityStatus(nextState, params.fallbackPaymentStatus);

  await tx.orderPaymentLedger.update({
    where: { id: ledger.id },
    data: {
      totalPaid: new Prisma.Decimal(safeConfirmed),
      balanceDue: new Prisma.Decimal(balanceDue),
      state: nextState
    }
  });

  await tx.onlineOrder.update({
    where: { id: params.orderId },
    data: {
      paymentStatus: compatibilityStatus
    }
  });
}

function normalizeStatus(value: string) {
  const normalized = normalizeOnlineOrderStatus(value);
  if (!normalized) {
    throw ApiErrors.orderStatusInvalid;
  }
  return toApiStatus(normalized);
}

function normalizeBranchPrefix(name: string) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
  const prefix = normalized.slice(0, 3);
  return prefix || "ONL";
}

function buildOrderCode(prefix: string, orderNumber: number) {
  const normalizedPrefix = prefix.slice(0, 3) || "ONL";
  const padded = orderNumber.toString().padStart(6, "0");
  return `${normalizedPrefix}-${padded}`;
}

function toDbStatus(value: string): OnlineOrderStatus {
  if (value === "CANCELLED_MANUAL") {
    return "CANCELLED_MANUAL";
  }
  if (value === "CANCELLED_EXPIRED") {
    return "CANCELLED_EXPIRED";
  }
  if (value === "CREATED") {
    return "CREATED";
  }
  if (value === "PENDING_PAYMENT") {
    return "PENDING_PAYMENT";
  }
  if (value === "PAID") {
    return "PAID";
  }
  if (value === "PAID_BY_TRANSFER") {
    return "PAID_BY_TRANSFER";
  }
  if (value === "READY_FOR_PICKUP") {
    return "READY_FOR_PICKUP";
  }
  if (value === "COMPLETED") {
    return "COMPLETED";
  }
  if (value === "SHIPPED") {
    return "SHIPPED";
  }
  if (value === "CANCELLED_REFUNDED") {
    return "CANCELLED_REFUNDED";
  }
  throw ApiErrors.orderStatusInvalid;
}

function toAvailability(available: number) {
  if (available <= 0) {
    return "out_of_stock";
  }
  if (available <= LOW_STOCK_THRESHOLD) {
    return "low_stock";
  }
  return "in_stock";
}

function toSnapshotPrice(value: Prisma.Decimal | null) {
  if (value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchInventorySnapshots(productIds: string[]) {
  if (productIds.length === 0) {
    return [];
  }
  return prisma.readModelInventory.findMany({
    where: { productId: { in: productIds } },
    select: {
      productId: true,
      available: true,
      price: true
    }
  });
}

function buildSnapshots(params: {
  items: Array<{ productId: string; quantity: number }>;
  inventoryRows: Array<{ productId: string; available: number; price: Prisma.Decimal | null }>;
}) {
  const inventoryMap = new Map(
    params.inventoryRows.map((row) => [row.productId, { available: row.available, price: row.price }])
  );

  const normalized: Array<{
    productId: string;
    quantity: number;
    priceSnapshot: number;
    currency: string;
    availabilitySnapshot: string;
  }> = [];
  const removedItems: Array<{ productId: string; reason: "insufficient" | "missing" }> = [];

  params.items.forEach((item) => {
    const record = inventoryMap.get(item.productId);
    if (!record) {
      removedItems.push({ productId: item.productId, reason: "missing" });
      return;
    }
    if (record.available <= 0 || record.available < item.quantity) {
      removedItems.push({ productId: item.productId, reason: "insufficient" });
      return;
    }
    const priceSnapshot = toSnapshotPrice(record.price);
    if (priceSnapshot === null) {
      removedItems.push({ productId: item.productId, reason: "missing" });
      return;
    }
    normalized.push({
      productId: item.productId,
      quantity: item.quantity,
      priceSnapshot,
      currency: "MXN",
      availabilitySnapshot: toAvailability(record.available)
    });
  });

  return { items: normalized, removedItems };
}

async function releaseReservations(
  tx: Prisma.TransactionClient,
  orderId: string,
  now: Date
) {
  const reservations = await tx.inventoryReservation.findMany({
    where: { orderId, status: "ACTIVE" }
  });

  for (const reservation of reservations) {
    await tx.readModelInventory.updateMany({
      where: { productId: reservation.productId },
      data: { available: { increment: reservation.quantity } }
    });
  }

  await tx.inventoryReservation.updateMany({
    where: { orderId, status: "ACTIVE" },
    data: { status: "RELEASED", releasedAt: now }
  });
}

function mapStatusTimeline(statusLogs: Array<{
  id: string;
  fromStatus: OnlineOrderStatus | null;
  toStatus: OnlineOrderStatus;
  reason: string | null;
  approvedByAdminId?: string | null;
  approvedByAdminName?: string | null;
  adminMessage?: string | null;
  actorUserId: string | null;
  actorRole?: string | null;
  actorDisplayName?: string | null;
  createdAt: Date;
}>) {
  return statusLogs
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((row) => ({
      id: row.id,
      fromStatus: row.fromStatus ? normalizeStatus(row.fromStatus) : null,
      toStatus: normalizeStatus(row.toStatus),
      reason: row.reason,
      approvedByAdminName: row.approvedByAdminName ?? null,
      adminMessage: row.adminMessage ?? null,
      actorDisplayName:
        row.actorDisplayName ?? row.approvedByAdminName ?? (row.actorUserId ? "Admin" : "System"),
      actorType: row.actorRole ?? (row.actorUserId ? "ADMIN" : "SYSTEM"),
      createdAt: row.createdAt.toISOString()
    }));
}

function deriveRefundStateByItem(
  items: Array<{ id: string; quantity: number; priceSnapshot: Prisma.Decimal | number }>,
  refunds: Array<{ orderItemId: string | null; amount: Prisma.Decimal | number }>
) {
  const refundedByItem = new Map<string, number>();
  let orderLevelRefundTotal = 0;
  for (const refund of refunds) {
    if (!refund.orderItemId) {
      orderLevelRefundTotal += toMoney(refund.amount);
      continue;
    }
    refundedByItem.set(refund.orderItemId, (refundedByItem.get(refund.orderItemId) ?? 0) + toMoney(refund.amount));
  }

  const subtotal = items.reduce((sum, item) => sum + toMoney(item.priceSnapshot) * item.quantity, 0);
  const totalRefunded = refunds.reduce((sum, refund) => sum + toMoney(refund.amount), 0);
  const fullOrderRefund = orderLevelRefundTotal > 0 && totalRefunded >= subtotal;
  const partialOrderRefund = orderLevelRefundTotal > 0 && !fullOrderRefund;

  return new Map(
    items.map((item) => {
      const lineTotal = toMoney(item.priceSnapshot) * item.quantity;
      const refunded = refundedByItem.get(item.id) ?? 0;
      let state: "NONE" | "PARTIAL" | "FULL" = refunded <= 0 ? "NONE" : refunded >= lineTotal ? "FULL" : "PARTIAL";
      if (fullOrderRefund) {
        state = "FULL";
      } else if (partialOrderRefund && state === "NONE") {
        state = "PARTIAL";
      }
      return [item.id, state as "NONE" | "PARTIAL" | "FULL"];
    })
  );
}

function buildOrderTotals(params: {
  subtotal: number;
  refundsTotal: number;
  paidTotal: number;
  balanceDue: number;
}) {
  const refundsTotal = roundMoney(Math.max(0, params.refundsTotal));
  const subtotal = roundMoney(Math.max(0, params.subtotal));
  const finalTotal = roundMoney(Math.max(0, subtotal - refundsTotal));
  const paidTotal = roundMoney(Math.max(0, params.paidTotal));
  const balanceDue = roundMoney(Math.max(0, params.balanceDue));
  return {
    subtotal,
    refundsTotal,
    finalTotal,
    paidTotal,
    balanceDue
  };
}

export async function createOrUpdateDraft(params: {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    priceSnapshot?: number | null;
    availabilitySnapshot?: string | null;
  }>;
}) {
  const productIds = params.items.map((item) => item.productId);
  const inventoryRows = await fetchInventorySnapshots(productIds);
  const snapshots = buildSnapshots({ items: params.items, inventoryRows });

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.preorderDraft.findFirst({
      where: { userId: params.userId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" }
    });

    const draft = existing
      ? await tx.preorderDraft.update({
          where: { id: existing.id },
          data: { updatedAt: new Date() }
        })
      : await tx.preorderDraft.create({
          data: { userId: params.userId, status: "ACTIVE" }
        });

    await tx.preorderDraftItem.deleteMany({ where: { draftId: draft.id } });

    if (snapshots.items.length) {
      await tx.preorderDraftItem.createMany({
        data: snapshots.items.map((item) => ({
          draftId: draft.id,
          productId: item.productId,
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot,
          currency: item.currency,
          availabilitySnapshot: item.availabilitySnapshot
        }))
      });
    }

    return { draftId: draft.id, items: snapshots.items, removedItems: snapshots.removedItems };
  });

  return result;
}

export async function getActiveDraft(params: { userId: string }) {
  const draft = await prisma.preorderDraft.findFirst({
    where: { userId: params.userId, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    include: { items: true }
  });

  if (!draft) {
    return null;
  }

  const productIds = draft.items.map((item) => item.productId);
  const inventoryRows = await prisma.readModelInventory.findMany({
    where: { productId: { in: productIds } },
    select: {
      productId: true,
      displayName: true,
      slug: true,
      imageUrl: true,
      game: true
    }
  });
  const inventoryMap = new Map(
    inventoryRows.map((row) => [
      row.productId,
      {
        name: row.displayName ?? null,
        slug: row.slug ?? null,
        imageUrl: row.imageUrl ?? null,
        game: row.game ?? null
      }
    ])
  );

  return {
    draftId: draft.id,
    items: draft.items.map((item) => {
      const info = inventoryMap.get(item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        priceSnapshot: Number(item.priceSnapshot),
        currency: item.currency,
        availabilitySnapshot: item.availabilitySnapshot,
        name: info?.name ?? item.productId,
        slug: info?.slug ?? null,
        imageUrl: info?.imageUrl ?? null,
        game: info?.game ?? null
      };
    })
  };
}

export async function revalidateItems(params: {
  items: Array<{ productId: string; quantity: number }>;
}) {
  const productIds = params.items.map((item) => item.productId);
  const inventoryRows = await fetchInventorySnapshots(productIds);
  return buildSnapshots({ items: params.items, inventoryRows });
}

export async function createOrder(params: {
  userId: string;
  draftId: string;
  paymentMethod: "PAY_IN_STORE" | "BANK_TRANSFER";
  pickupBranchId: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const existingOrder = await tx.onlineOrder.findFirst({
      where: { draftId: params.draftId },
      include: {
        user: { select: { email: true, emailLocale: true } },
        pickupBranch: { select: { name: true } }
      }
    });

    if (existingOrder) {
      return {
        orderId: existingOrder.id,
        orderNumber: existingOrder.orderNumber,
        orderCode: existingOrder.orderCode,
        status: normalizeStatus(existingOrder.status),
        paymentMethod: existingOrder.paymentMethod,
        paymentStatus: existingOrder.paymentStatus,
        expiresAt: existingOrder.expiresAt.toISOString(),
        customerId: existingOrder.userId,
        customerEmail: existingOrder.user?.email ?? null,
        customerEmailLocale: existingOrder.user?.emailLocale ?? null,
        subtotal: Number(existingOrder.subtotal),
        currency: existingOrder.currency,
        pickupBranchName: existingOrder.pickupBranch?.name ?? null
      };
    }

    const draft = await tx.preorderDraft.findFirst({
      where: { id: params.draftId, userId: params.userId },
      include: { items: true }
    });

    if (!draft) {
      throw ApiErrors.checkoutDraftNotFound;
    }

    if (draft.status !== "ACTIVE") {
      throw ApiErrors.checkoutDraftInactive;
    }

    let pickupBranchName: string | null = null;
    if (params.pickupBranchId) {
      const branch = await tx.pickupBranch.findUnique({ where: { id: params.pickupBranchId } });
      if (!branch) {
        throw ApiErrors.branchNotFound;
      }
      pickupBranchName = branch.name;
    }

    if (!draft.items.length) {
      throw ApiErrors.checkoutDraftEmpty;
    }

    const productIds = draft.items.map((item) => item.productId);
    const inventoryRows = await tx.readModelInventory.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, available: true }
    });
    const inventoryMap = new Map(inventoryRows.map((row) => [row.productId, row.available]));

    for (const item of draft.items) {
      const available = inventoryMap.get(item.productId);
      if (available === undefined || available < item.quantity || available <= 0) {
        throw ApiErrors.checkoutInventoryInsufficient;
      }
    }

    const subtotal = draft.items.reduce((sum, item) => {
      const price = Number(item.priceSnapshot);
      return sum + price * item.quantity;
    }, 0);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

    const prefix = params.pickupBranchId ? normalizeBranchPrefix(pickupBranchName ?? "") : "ONL";
    const nextNumberRows =
      await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('order_number_seq') AS nextval`;
    const orderNumber = Number(nextNumberRows[0]?.nextval ?? 0);
    if (!Number.isFinite(orderNumber) || orderNumber <= 0) {
      throw ApiErrors.checkoutInvalid;
    }
    const orderCode = buildOrderCode(prefix, orderNumber);

    const order = await tx.onlineOrder.create({
      data: {
        userId: params.userId,
        draftId: draft.id,
        status: "PENDING_PAYMENT",
        statusUpdatedAt: now,
        paymentMethod: params.paymentMethod,
        paymentStatus: params.paymentMethod === "BANK_TRANSFER" ? "PENDING_TRANSFER" : "PAID",
        pickupBranchId: params.pickupBranchId,
        subtotal: new Prisma.Decimal(subtotal),
        currency: "MXN",
        expiresAt,
        orderNumber,
        orderCode
      },
      include: {
        user: { select: { email: true, emailLocale: true } },
        pickupBranch: { select: { name: true } }
      }
    });

    await tx.onlineOrderItem.createMany({
      data: draft.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        currency: item.currency,
        availabilitySnapshot: item.availabilitySnapshot
      }))
    });

    await tx.inventoryReservation.createMany({
      data: draft.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        status: "ACTIVE",
        expiresAt
      }))
    });

    for (const item of draft.items) {
      await tx.readModelInventory.update({
        where: { productId: item.productId },
        data: { available: { decrement: item.quantity } }
      });
    }

    await tx.preorderDraft.update({
      where: { id: draft.id },
      data: { status: "CONVERTED" }
    });

    await tx.onlineOrderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: null,
        toStatus: "PENDING_PAYMENT",
        reason: "order_created",
        actorUserId: null
      }
    });

    await ensurePaymentLedger(tx, {
      orderId: order.id,
      subtotal,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    });

    await recomputePaymentLedger(tx, {
      orderId: order.id,
      fallbackPaymentStatus: order.paymentStatus
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderCode: order.orderCode,
      status: normalizeStatus(order.status),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      expiresAt: order.expiresAt.toISOString(),
      customerId: order.userId,
      customerEmail: order.user?.email ?? null,
      customerEmailLocale: order.user?.emailLocale ?? null,
      subtotal,
      currency: order.currency,
      pickupBranchName: order.pickupBranch?.name ?? null
    };
  });
}

export async function getOrder(params: { userId: string; orderId: string }) {
  const order = await prisma.onlineOrder.findFirst({
    where: { id: params.orderId, userId: params.userId },
    include: {
      items: true,
      pickupBranch: true,
      statusLogs: true,
      paymentLedger: { select: { totalPaid: true, balanceDue: true } },
      refunds: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!order) {
    return null;
  }

  const refundsTotal = order.refunds.reduce((sum, refund) => sum + toMoney(refund.amount), 0);
  const paidTotal = order.paymentLedger ? toMoney(order.paymentLedger.totalPaid) : 0;
  const balanceDue = order.paymentLedger ? toMoney(order.paymentLedger.balanceDue) : 0;
  const totals = buildOrderTotals({
    subtotal: toMoney(order.subtotal),
    refundsTotal,
    paidTotal,
    balanceDue
  });
  const refundStateByItem = deriveRefundStateByItem(order.items, order.refunds);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderCode: order.orderCode,
    status: normalizeStatus(order.status),
    paymentMethod: order.paymentMethod,
    subtotal: toMoney(order.subtotal),
    currency: order.currency,
    expiresAt: order.expiresAt.toISOString(),
    statusUpdatedAt: order.statusUpdatedAt.toISOString(),
    pickupBranch: order.pickupBranch,
    items: order.items.map((item) => ({
      ...item,
      priceSnapshot: toMoney(item.priceSnapshot),
      refundState: refundStateByItem.get(item.id) ?? "NONE"
    })),
    refunds: order.refunds.map((refund) => ({
      id: refund.id,
      orderItemId: refund.orderItemId,
      amount: toMoney(refund.amount),
      currency: refund.currency,
      refundMethod: refund.refundMethod,
      adminDisplayName: refund.adminName,
      adminMessage: refund.adminMessage,
      createdAt: refund.createdAt.toISOString()
    })),
    totals,
    timeline: mapStatusTimeline(order.statusLogs)
  };
}

export async function listAdminOrders(params: {
  page: number;
  pageSize: number;
  actorRole?: string;
  actorBranchId?: string | null;
  query?: string;
  status?: string;
  sort?: "createdAt" | "status" | "expiresAt" | "subtotal";
  direction?: "asc" | "desc";
}) {
  const search = params.query?.trim();
  const isUuid = Boolean(
    search && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(search)
  );
  const isOrderNumber = Boolean(search && /^\d+$/.test(search));
  const orderCodeQuery = search ? search.toUpperCase() : null;

  const where: Prisma.OnlineOrderWhereInput = {
    ...(params.actorRole === "EMPLOYEE" ? { pickupBranchId: params.actorBranchId ?? "__NO_BRANCH__" } : {}),
    ...(params.status ? { status: toDbStatus(params.status) } : {}),
    ...(search
      ? {
          OR: [
            ...(isUuid ? [{ id: search }] : []),
            ...(isOrderNumber ? [{ orderNumber: Number(search) }] : []),
            ...(orderCodeQuery
              ? [
                  { orderCode: orderCodeQuery },
                  { orderCode: { startsWith: orderCodeQuery } }
                ]
              : []),
            { user: { email: { contains: search, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const sortFieldMap: Record<
    "createdAt" | "status" | "expiresAt" | "subtotal",
    "createdAt" | "status" | "expiresAt" | "subtotal"
  > = {
    createdAt: "createdAt",
    status: "status",
    expiresAt: "expiresAt",
    subtotal: "subtotal"
  };
  const sortField = params.sort ? sortFieldMap[params.sort] : "createdAt";
  const sortDirection = params.direction ?? "desc";

  const [items, total] = await prisma.$transaction([
    prisma.onlineOrder.findMany({
      where,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      orderBy: { [sortField]: sortDirection },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        pickupBranch: { select: { name: true, city: true } },
        items: { select: { id: true, productId: true, quantity: true, priceSnapshot: true, currency: true } },
        refunds: { select: { orderItemId: true, amount: true } },
        paymentLedger: { select: { totalPaid: true, balanceDue: true } }
      }
    }),
    prisma.onlineOrder.count({ where })
  ]);

  return {
    items: items.map((item) => ({
      ...(() => {
        const itemLineTotals = new Map(
          item.items.map((orderItem) => [orderItem.id, toMoney(orderItem.priceSnapshot) * orderItem.quantity])
        );
        const refundsByKey = new Map<string, { orderItemId: string | null; amount: number }>();
        for (const refund of item.refunds) {
          const key = refund.orderItemId ?? "__FULL_ORDER__";
          const current = refundsByKey.get(key);
          refundsByKey.set(key, {
            orderItemId: refund.orderItemId,
            amount: (current?.amount ?? 0) + toMoney(refund.amount)
          });
        }
        return {
          totalsBreakdown: {
            items: item.items.map((orderItem) => ({
              id: orderItem.id,
              label: orderItem.productId,
              quantity: orderItem.quantity,
              amount: toMoney(orderItem.priceSnapshot) * orderItem.quantity,
              currency: orderItem.currency
            })),
            refunds: Array.from(refundsByKey.values()).map((refund) => {
              const itemTotal = refund.orderItemId ? itemLineTotals.get(refund.orderItemId) ?? 0 : 0;
              const state = refund.orderItemId
                ? refund.amount >= itemTotal
                  ? "FULL"
                  : "PARTIAL"
                : "FULL";
              const label = refund.orderItemId
                ? item.items.find((orderItem) => orderItem.id === refund.orderItemId)?.productId ?? refund.orderItemId
                : "FULL_ORDER";
              return {
                orderItemId: refund.orderItemId,
                label,
                state,
                amount: roundMoney(refund.amount)
              };
            })
          }
        };
      })(),
      totals: buildOrderTotals({
        subtotal: toMoney(item.subtotal),
        refundsTotal: item.refunds.reduce((sum, refund) => sum + toMoney(refund.amount), 0),
        paidTotal: item.paymentLedger ? toMoney(item.paymentLedger.totalPaid) : 0,
        balanceDue: item.paymentLedger ? toMoney(item.paymentLedger.balanceDue) : 0
      }),
      id: item.id,
      orderNumber: item.orderNumber,
      orderCode: item.orderCode,
      status: normalizeStatus(item.status),
      paymentStatus: item.paymentStatus,
      subtotal: toMoney(item.subtotal),
      currency: item.currency,
      paymentMethod: item.paymentMethod,
      expiresAt: item.expiresAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      statusUpdatedAt: item.statusUpdatedAt.toISOString(),
      customer: {
        email: item.user.email,
        name: [item.user.firstName, item.user.lastName].filter(Boolean).join(" ") || null
      },
      pickupBranch: item.pickupBranch
        ? { name: item.pickupBranch.name, city: item.pickupBranch.city }
        : null
    })),
    total
  };
}

export async function getOrderTransitionContext(params: { orderId: string }) {
  const order = await prisma.onlineOrder.findUnique({
    where: { id: params.orderId },
    select: {
      id: true,
      orderNumber: true,
      orderCode: true,
      status: true,
      paymentMethod: true,
      pickupBranchId: true
    }
  });

  if (!order) {
    return null;
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderCode: order.orderCode,
    status: normalizeStatus(order.status),
    paymentMethod: order.paymentMethod,
    pickupBranchId: order.pickupBranchId
  };
}

export async function getAdminOrder(params: { orderId: string; actorRole?: string; actorBranchId?: string | null }) {
  const order = await prisma.onlineOrder.findUnique({
    where: { id: params.orderId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      pickupBranch: true,
      items: true,
      refunds: { orderBy: { createdAt: "asc" } },
      paymentLedger: { select: { totalPaid: true, balanceDue: true } },
      statusLogs: {
        include: { actor: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!order) {
    return null;
  }
  if (params.actorRole === "EMPLOYEE" && order.pickupBranchId !== params.actorBranchId) {
    throw ApiErrors.branchForbidden;
  }

  const refundsTotal = order.refunds.reduce((sum, refund) => sum + toMoney(refund.amount), 0);
  const paidTotal = order.paymentLedger ? toMoney(order.paymentLedger.totalPaid) : 0;
  const balanceDue = order.paymentLedger ? toMoney(order.paymentLedger.balanceDue) : 0;
  const totals = buildOrderTotals({
    subtotal: toMoney(order.subtotal),
    refundsTotal,
    paidTotal,
    balanceDue
  });
  const refundStateByItem = deriveRefundStateByItem(order.items, order.refunds);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderCode: order.orderCode,
    status: normalizeStatus(order.status),
    paymentStatus: order.paymentStatus,
    subtotal: toMoney(order.subtotal),
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    expiresAt: order.expiresAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    statusUpdatedAt: order.statusUpdatedAt.toISOString(),
    cancelReason: order.cancelReason,
    customer: {
      id: order.user.id,
      email: order.user.email,
      name: [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || null
    },
    pickupBranch: order.pickupBranch,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      priceSnapshot: toMoney(item.priceSnapshot),
      currency: item.currency,
      availabilitySnapshot: item.availabilitySnapshot,
      refundState: refundStateByItem.get(item.id) ?? "NONE"
    })),
    refunds: order.refunds.map((refund) => ({
      id: refund.id,
      orderItemId: refund.orderItemId,
      amount: toMoney(refund.amount),
      currency: refund.currency,
      refundMethod: refund.refundMethod,
      adminId: refund.adminId,
      adminDisplayName: refund.adminName,
      adminMessage: refund.adminMessage,
      createdAt: refund.createdAt.toISOString()
    })),
    totals,
    timeline: order.statusLogs.map((row) => ({
      id: row.id,
      fromStatus: row.fromStatus ? normalizeStatus(row.fromStatus) : null,
      toStatus: normalizeStatus(row.toStatus),
      reason: row.reason,
      approvedByAdminId: row.approvedByAdminId ?? null,
      approvedByAdminName: row.approvedByAdminName ?? null,
      adminMessage: row.adminMessage ?? null,
      actor: row.actor
        ? {
            id: row.actor.id,
            email: row.actor.email,
            name: [row.actor.firstName, row.actor.lastName].filter(Boolean).join(" ") || null
          }
        : null,
      createdAt: row.createdAt.toISOString()
    }))
  };
}

export async function listCustomerOrders(params: {
  userId: string;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.OnlineOrderWhereInput = { userId: params.userId };
  const [items, total] = await prisma.$transaction([
    prisma.onlineOrder.findMany({
      where,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        pickupBranch: { select: { name: true, city: true } },
        items: { select: { id: true, productId: true, quantity: true, priceSnapshot: true } },
        refunds: { select: { orderItemId: true, amount: true, refundMethod: true } },
        paymentLedger: { select: { totalPaid: true, balanceDue: true } }
      }
    }),
    prisma.onlineOrder.count({ where })
  ]);

  const allProductIds = Array.from(
    new Set(items.flatMap((order) => order.items.map((orderItem) => orderItem.productId)))
  );
  const productNames = allProductIds.length
    ? await prisma.readModelInventory.findMany({
        where: { productId: { in: allProductIds } },
        select: { productId: true, displayName: true }
      })
    : [];
  const productNameById = new Map(productNames.map((row) => [row.productId, row.displayName || row.productId]));

  return {
    items: items.map((item) => ({
      ...(() => {
        const subtotal = toMoney(item.subtotal);
        const refundsTotal = item.refunds.reduce((sum, refund) => sum + toMoney(refund.amount), 0);
        const finalTotal = Math.max(0, subtotal - refundsTotal);
        const itemLineTotalById = new Map(
          item.items.map((orderItem) => [orderItem.id, toMoney(orderItem.priceSnapshot) * orderItem.quantity])
        );
        const totalsBreakdownItems = item.items.map((orderItem) => ({
          productName: productNameById.get(orderItem.productId) ?? orderItem.productId,
          qty: orderItem.quantity,
          lineTotalCents: Math.round(toMoney(orderItem.priceSnapshot) * orderItem.quantity * 100)
        }));
        const groupedRefunds = new Map<
          string,
          { orderItemId: string | null; amount: number; method: string; productName: string; type: "FULL" | "PARTIAL" }
        >();
        for (const refund of item.refunds) {
          const key = `${refund.orderItemId ?? "FULL_ORDER"}:${refund.refundMethod}`;
          const existing = groupedRefunds.get(key);
          const lineTotal = refund.orderItemId ? itemLineTotalById.get(refund.orderItemId) ?? 0 : 0;
          const nextAmount = (existing?.amount ?? 0) + toMoney(refund.amount);
          const type: "FULL" | "PARTIAL" = refund.orderItemId
            ? nextAmount >= lineTotal
              ? "FULL"
              : "PARTIAL"
            : "FULL";
          groupedRefunds.set(key, {
            orderItemId: refund.orderItemId,
            amount: nextAmount,
            method: refund.refundMethod,
            productName: refund.orderItemId
              ? productNameById.get(item.items.find((orderItem) => orderItem.id === refund.orderItemId)?.productId ?? "") ??
                (item.items.find((orderItem) => orderItem.id === refund.orderItemId)?.productId ?? refund.orderItemId)
              : "FULL_ORDER",
            type
          });
        }
        return {
          totals: {
            subtotalCents: Math.round(subtotal * 100),
            refundsCents: Math.round(refundsTotal * 100),
            totalCents: Math.round(finalTotal * 100),
            currency: item.currency
          },
          totalsBreakdown: {
            items: totalsBreakdownItems,
            refunds: Array.from(groupedRefunds.values()).map((refund) => ({
              productName: refund.productName,
              amountCents: Math.round(refund.amount * 100),
              type: refund.type,
              method: refund.method
            }))
          }
        };
      })(),
      id: item.id,
      orderNumber: item.orderNumber,
      orderCode: item.orderCode,
      status: normalizeStatus(item.status),
      paymentStatus: item.paymentStatus,
      subtotal: toMoney(item.subtotal),
      currency: item.currency,
      paymentMethod: item.paymentMethod,
      expiresAt: item.expiresAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      statusUpdatedAt: item.statusUpdatedAt.toISOString(),
      pickupBranch: item.pickupBranch
        ? { name: item.pickupBranch.name, city: item.pickupBranch.city }
        : null
    })),
    total
  };
}

export async function getCustomerOrder(params: { userId: string; orderId: string }) {
  const order = await prisma.onlineOrder.findUnique({
    where: { id: params.orderId },
    include: {
      pickupBranch: true,
      items: true,
      refunds: { orderBy: { createdAt: "asc" } },
      paymentLedger: { select: { totalPaid: true, balanceDue: true } },
      statusLogs: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!order) {
    return null;
  }

  if (order.userId !== params.userId) {
    throw ApiErrors.orderForbidden;
  }

  const refundsTotal = order.refunds.reduce((sum, refund) => sum + toMoney(refund.amount), 0);
  const paidTotal = order.paymentLedger ? toMoney(order.paymentLedger.totalPaid) : 0;
  const balanceDue = order.paymentLedger ? toMoney(order.paymentLedger.balanceDue) : 0;
  const totals = buildOrderTotals({
    subtotal: toMoney(order.subtotal),
    refundsTotal,
    paidTotal,
    balanceDue
  });
  const refundStateByItem = deriveRefundStateByItem(order.items, order.refunds);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderCode: order.orderCode,
    status: normalizeStatus(order.status),
    paymentStatus: order.paymentStatus,
    subtotal: toMoney(order.subtotal),
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    expiresAt: order.expiresAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    statusUpdatedAt: order.statusUpdatedAt.toISOString(),
    pickupBranch: order.pickupBranch,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      priceSnapshot: toMoney(item.priceSnapshot),
      currency: item.currency,
      availabilitySnapshot: item.availabilitySnapshot,
      refundState: refundStateByItem.get(item.id) ?? "NONE"
    })),
    refunds: order.refunds.map((refund) => ({
      id: refund.id,
      orderItemId: refund.orderItemId,
      amount: toMoney(refund.amount),
      currency: refund.currency,
      refundMethod: refund.refundMethod,
      adminDisplayName: refund.adminName,
      adminMessage: refund.adminMessage,
      createdAt: refund.createdAt.toISOString()
    })),
    totals,
    timeline: mapStatusTimeline(order.statusLogs)
  };
}

export async function transitionOrderStatus(params: {
  orderId: string;
  fromStatus: string;
  toStatus: string;
  actorUserId: string | null;
  actorRole?: string;
  actorBranchId?: string | null;
  actorDisplayName?: string | null;
  reason: string | null;
  adminMessage: string | null;
  source: "admin" | "system";
}) {
  const toStatus = normalizeStatus(params.toStatus);
  const fromStatus = normalizeStatus(params.fromStatus);

  return prisma.$transaction(async (tx) => {
    const order = await tx.onlineOrder.findUnique({
      where: { id: params.orderId },
      include: {
        user: { select: { email: true, emailLocale: true } }
      }
    });

    if (!order) {
      throw ApiErrors.checkoutOrderNotFound;
    }
    if (params.actorRole === "EMPLOYEE" && order.pickupBranchId !== params.actorBranchId) {
      throw ApiErrors.branchForbidden;
    }

    const currentStatus = normalizeStatus(order.status);
    if (currentStatus !== fromStatus) {
      throw ApiErrors.orderTransitionInvalid;
    }
    if (fromStatus === toStatus) {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderCode: order.orderCode,
        fromStatus,
        toStatus,
        customerId: order.userId,
        customerEmail: order.user.email ?? null,
        customerEmailLocale: order.user.emailLocale ?? null
      };
    }

    const now = new Date();
    let approvedByAdminName: string | null = null;
    if (toStatus === "PAID_BY_TRANSFER" && params.actorUserId) {
      const actor = await tx.user.findUnique({
        where: { id: params.actorUserId },
        select: { firstName: true, lastName: true, email: true }
      });
      if (actor) {
        approvedByAdminName =
          [actor.firstName, actor.lastName].filter(Boolean).join(" ") || actor.email || "Admin";
      }
    }
    if (toStatus === "CANCELLED_EXPIRED" || toStatus === "CANCELLED_MANUAL") {
      await releaseReservations(tx, order.id, now);
    }

    const updatedOrder = await tx.onlineOrder.update({
      where: { id: order.id },
      data: {
        status: toDbStatus(toStatus),
        statusUpdatedAt: now,
        cancelReason: toStatus === "CANCELLED_MANUAL" ? params.reason ?? null : null,
        cancelledByUserId: toStatus === "CANCELLED_MANUAL" ? params.actorUserId : null,
        paymentStatus: toStatus === "PAID_BY_TRANSFER" || toStatus === "PAID" ? "PAID" : order.paymentStatus
      },
      select: {
        id: true,
        subtotal: true,
        currency: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await tx.onlineOrderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: toDbStatus(fromStatus),
        toStatus: toDbStatus(toStatus),
        reason: params.reason,
        actorUserId: params.actorUserId,
        actorRole: params.actorRole ?? null,
        actorDisplayName: params.actorDisplayName ?? null,
        approvedByAdminId: toStatus === "PAID_BY_TRANSFER" ? params.actorUserId : null,
        approvedByAdminName: toStatus === "PAID_BY_TRANSFER" ? approvedByAdminName : null,
        adminMessage: toStatus === "PAID_BY_TRANSFER" ? params.adminMessage : null
      }
    });

    await ensurePaymentLedger(tx, {
      orderId: updatedOrder.id,
      subtotal: Number(updatedOrder.subtotal),
      currency: updatedOrder.currency,
      paymentMethod: updatedOrder.paymentMethod,
      paymentStatus: updatedOrder.paymentStatus,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt
    });

    if (toStatus === "PAID_BY_TRANSFER" || toStatus === "PAID") {
      const ledger = await tx.orderPaymentLedger.findUnique({
        where: { orderId: updatedOrder.id },
        select: { id: true, balanceDue: true }
      });
      if (ledger) {
        const remaining = Number(ledger.balanceDue);
        if (Number.isFinite(remaining) && remaining > 0) {
          await tx.orderPaymentEntry.create({
            data: {
              ledgerId: ledger.id,
              orderId: updatedOrder.id,
              method: mapPaymentMethodToEntryMethod(updatedOrder.paymentMethod),
              provider: "NONE",
              providerRef: null,
              amount: new Prisma.Decimal(remaining),
              currency: updatedOrder.currency,
              entryStatus: "CONFIRMED",
              isStoreCredit: false,
              notes: toStatus === "PAID_BY_TRANSFER" ? "transfer_approved" : "payment_confirmed",
              actorId: params.actorUserId,
              actorType: params.actorUserId ? "ADMIN" : "SYSTEM",
              sourceChannel: params.source === "admin" ? "ADMIN_PANEL" : "JOB"
            }
          });
        }
      }
    }

    await recomputePaymentLedger(tx, {
      orderId: updatedOrder.id,
      fallbackPaymentStatus: updatedOrder.paymentStatus
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderCode: order.orderCode,
      fromStatus,
      toStatus,
      customerId: order.userId,
      customerEmail: order.user.email ?? null,
      customerEmailLocale: order.user.emailLocale ?? null
    };
  });
}

export async function createRefund(params: {
  orderId: string;
  orderItemId: string | null;
  amount: number;
  refundMethod: RefundMethod;
  adminId: string | null;
  actorRole?: string;
  actorBranchId?: string | null;
  actorDisplayName?: string | null;
  adminMessage: string;
}) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.onlineOrder.findUnique({
      where: { id: params.orderId },
      include: {
        items: true,
        paymentLedger: { select: { id: true, totalPaid: true, balanceDue: true } },
        refunds: true
      }
    });

    if (!order) {
      throw ApiErrors.checkoutOrderNotFound;
    }
    if (params.actorRole === "EMPLOYEE" && order.pickupBranchId !== params.actorBranchId) {
      throw ApiErrors.branchForbidden;
    }

    if (order.status !== "COMPLETED") {
      throw ApiErrors.refundNotAllowedForStatus;
    }

    const admin = params.adminId
      ? await tx.user.findUnique({
          where: { id: params.adminId },
          select: { firstName: true, lastName: true, email: true }
        })
      : null;
    const adminName =
      (params.actorDisplayName ??
      [admin?.firstName, admin?.lastName].filter(Boolean).join(" ")) ||
      admin?.email ||
      "Admin";

    const subtotal = toMoney(order.subtotal);
    const paidLimit = order.paymentLedger ? toMoney(order.paymentLedger.totalPaid) : subtotal;
    const refundedTotal = order.refunds.reduce((sum, row) => sum + toMoney(row.amount), 0);
    const refundableRemainingOrder = roundMoney(Math.max(0, paidLimit - refundedTotal));

    if (refundableRemainingOrder <= 0) {
      throw ApiErrors.refundInvalidAmount;
    }

    let maxAllowed = refundableRemainingOrder;
    if (params.orderItemId) {
      const orderItem = order.items.find((item) => item.id === params.orderItemId);
      if (!orderItem) {
        throw ApiErrors.refundItemNotFound;
      }
      const itemLineTotal = roundMoney(toMoney(orderItem.priceSnapshot) * orderItem.quantity);
      const refundedForItem = order.refunds
        .filter((row) => row.orderItemId === params.orderItemId)
        .reduce((sum, row) => sum + toMoney(row.amount), 0);
      maxAllowed = roundMoney(Math.min(refundableRemainingOrder, Math.max(0, itemLineTotal - refundedForItem)));
    }

    const amount = roundMoney(params.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > maxAllowed) {
      throw ApiErrors.refundInvalidAmount;
    }

    const ledgerId =
      order.paymentLedger?.id ??
      (await ensurePaymentLedger(tx, {
        orderId: order.id,
        subtotal,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }));

    await tx.onlineOrderRefund.create({
      data: {
        orderId: order.id,
        orderItemId: params.orderItemId,
        amount: new Prisma.Decimal(amount),
        currency: order.currency,
        refundMethod: params.refundMethod,
        adminId: params.adminId,
        adminName,
        adminMessage: params.adminMessage
      }
    });

    await tx.orderPaymentEntry.create({
      data: {
        ledgerId,
        orderId: order.id,
        method: "REFUND",
        provider: "NONE",
        providerRef: null,
        amount: new Prisma.Decimal(amount),
        currency: order.currency,
        entryStatus: "REFUNDED",
        isStoreCredit: params.refundMethod === "STORE_CREDIT",
        notes: "order_refund",
        actorId: params.adminId,
        actorType: params.adminId ? "ADMIN" : "SYSTEM",
        sourceChannel: "ADMIN_PANEL"
      }
    });

    await recomputePaymentLedger(tx, {
      orderId: order.id,
      fallbackPaymentStatus: order.paymentStatus
    });

    const newRefundedTotal = roundMoney(refundedTotal + amount);
    const isFullyRefunded = paidLimit > 0 && newRefundedTotal >= roundMoney(paidLimit);
    if (isFullyRefunded) {
      await tx.onlineOrder.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED_REFUNDED",
          statusUpdatedAt: new Date()
        }
      });
      await tx.onlineOrderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: "COMPLETED",
          toStatus: "CANCELLED_REFUNDED",
          reason: "order_refunded",
          actorUserId: params.adminId,
          approvedByAdminId: params.adminId,
          approvedByAdminName: adminName,
          adminMessage: params.adminMessage
        }
      });
    }
  });

  const result = await getAdminOrder({ orderId: params.orderId });
  if (!result) {
    throw ApiErrors.checkoutOrderNotFound;
  }
  return result;
}

export async function expirePendingOrders() {
  const pending = await prisma.onlineOrder.findMany({
    where: {
      status: "PENDING_PAYMENT",
      paymentStatus: { not: "PAID" },
      expiresAt: { lte: new Date() }
    },
    select: { id: true }
  });

  const results: Array<{
    orderId: string;
    orderNumber: number;
    orderCode: string;
    fromStatus: string | null;
    toStatus: string;
    customerEmail: string | null;
    customerEmailLocale: "ES_MX" | "EN_US" | null;
    customerId: string | null;
  }> = [];

  for (const item of pending) {
    try {
      const transitioned = await transitionOrderStatus({
        orderId: item.id,
        fromStatus: "PENDING_PAYMENT",
        toStatus: "CANCELLED_EXPIRED",
        actorUserId: null,
        reason: "expired_unpaid",
        adminMessage: null,
        source: "system"
      });
      results.push(transitioned);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      appLogger.error("expiration transition failed", {
        orderId: item.id,
        error: message
      });
    }
  }

  return results;
}
