import { renderOrderStatusChangedEmail, resolveLocaleString, LOCALE } from "../../email";
import { OnlineOrderStatus } from "@prisma/client";

import type { EmailService, OrderFulfillmentRepository } from "../ports";
import { ApiErrors } from "../../errors/api-error";
import {
  FEATURE_DISABLED_TRANSITION_TARGETS,
  ORDER_STATUS_TRANSITIONS,
  normalizeOnlineOrderStatus,
  toApiStatus
} from "../../domain/order-status";

function normalizeStatus(value: string) {
  const normalized = normalizeOnlineOrderStatus(value);
  if (!normalized) {
    throw ApiErrors.orderStatusInvalid;
  }
  return normalized;
}

export type OrderFulfillmentUseCases = {
  listAdminOrders: (params: {
    page: number;
    pageSize: number;
    query?: string;
    status?: string;
    sort?: "createdAt" | "status" | "expiresAt" | "subtotal";
    direction?: "asc" | "desc";
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  getAdminOrder: (params: { orderId: string }) => Promise<Record<string, unknown> | null>;
  listCustomerOrders: (params: {
    userId: string;
    page: number;
    pageSize: number;
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  getCustomerOrder: (params: {
    userId: string;
    orderId: string;
  }) => Promise<Record<string, unknown> | null>;
  transitionOrderStatus: (params: {
    orderId: string;
    toStatus: string;
    actorUserId: string;
    reason: string | null;
    adminMessage: string | null;
  }) => Promise<{
    orderId: string;
    orderNumber: number;
    orderCode: string;
    fromStatus: string | null;
    toStatus: string;
  }>;
  runExpirationSweep: () => Promise<{ expired: number }>;
};

async function sendStatusMail(
  emailService: EmailService,
  payload: {
    orderId: string;
    orderCode: string;
    fromStatus: string | null;
    toStatus: string;
    customerEmail: string | null;
    customerEmailLocale?: "ES_MX" | "EN_US" | null;
    customerId?: string | null;
    reason?: string | null;
  }
) {
  const customerEmail = payload.customerEmail;
  if (!customerEmail) {
    return;
  }
  void (async () => {
    const resolvedLocale = resolveLocaleString(payload.customerEmailLocale, LOCALE.ES_MX);
    const mail = await renderOrderStatusChangedEmail({
      locale: resolvedLocale,
      orderCode: payload.orderCode,
      fromStatus: payload.fromStatus,
      toStatus: payload.toStatus,
      reason: payload.reason ?? null
    });
    await emailService.sendEmail({
      to: customerEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      meta: {
        userId: payload.customerId ?? null,
        template: "OrderStatusChangedEmail",
        locale: resolvedLocale,
        orderId: payload.orderId
      }
    });
  })();
}

export function createOrderFulfillmentUseCases(deps: {
  orderFulfillmentRepository: OrderFulfillmentRepository;
  emailService: EmailService;
}): OrderFulfillmentUseCases {
  return {
    listAdminOrders: (params) => deps.orderFulfillmentRepository.listAdminOrders(params),
    getAdminOrder: (params) => deps.orderFulfillmentRepository.getAdminOrder(params),
    listCustomerOrders: (params) => deps.orderFulfillmentRepository.listCustomerOrders(params),
    getCustomerOrder: (params) => deps.orderFulfillmentRepository.getCustomerOrder(params),
    async transitionOrderStatus(params) {
      const context = await deps.orderFulfillmentRepository.getOrderTransitionContext({
        orderId: params.orderId
      });
      if (!context) {
        throw ApiErrors.checkoutOrderNotFound;
      }

      const fromStatus = normalizeStatus(context.status);
      const toStatus = normalizeStatus(params.toStatus);
      if (fromStatus !== toStatus) {
        const allowed = ORDER_STATUS_TRANSITIONS[fromStatus] ?? [];
        if (!allowed.includes(toStatus)) {
          throw ApiErrors.orderTransitionInvalid;
        }
      }

      if (FEATURE_DISABLED_TRANSITION_TARGETS.has(toStatus)) {
        throw ApiErrors.orderTransitionInvalid;
      }

      if (toStatus === OnlineOrderStatus.PAID_BY_TRANSFER && context.paymentMethod !== "BANK_TRANSFER") {
        throw ApiErrors.orderTransitionInvalid;
      }

      if (context.paymentMethod === "BANK_TRANSFER" && toStatus === OnlineOrderStatus.PAID) {
        throw ApiErrors.orderTransitionInvalid;
      }

      if (toStatus === OnlineOrderStatus.CANCELLED_MANUAL && !params.reason?.trim()) {
        throw ApiErrors.orderTransitionReasonRequired;
      }

      const updated = await deps.orderFulfillmentRepository.transitionOrderStatus({
        orderId: params.orderId,
        fromStatus: toApiStatus(fromStatus),
        toStatus: toApiStatus(toStatus),
        actorUserId: params.actorUserId,
        reason: params.reason,
        adminMessage: params.adminMessage,
        source: "admin"
      });
      await sendStatusMail(deps.emailService, {
        orderId: updated.orderId,
        orderCode: updated.orderCode,
        fromStatus: updated.fromStatus,
        toStatus: updated.toStatus,
        customerEmail: updated.customerEmail,
        customerEmailLocale: updated.customerEmailLocale,
        customerId: updated.customerId,
        reason: params.reason
      });
      return {
        orderId: updated.orderId,
        orderNumber: updated.orderNumber,
        orderCode: updated.orderCode,
        fromStatus: updated.fromStatus,
        toStatus: updated.toStatus
      };
    },
    async runExpirationSweep() {
      const expired = await deps.orderFulfillmentRepository.expirePendingOrders();
      for (const entry of expired) {
        await sendStatusMail(deps.emailService, {
          orderId: entry.orderId,
          orderCode: entry.orderCode,
          fromStatus: entry.fromStatus,
          toStatus: entry.toStatus,
          customerEmail: entry.customerEmail,
          customerEmailLocale: entry.customerEmailLocale,
          customerId: entry.customerId,
          reason: "expired_unpaid"
        });
      }
      return { expired: expired.length };
    }
  };
}
