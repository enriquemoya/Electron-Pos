import type { CheckoutRepository } from "../ports";
import type { EmailService } from "../ports";
import { renderOrderCreatedEmail, resolveLocaleString, LOCALE } from "../../email";

export type CheckoutUseCases = {
  createDraft: (params: {
    userId: string;
    items: Array<{
      productId: string;
      quantity: number;
      priceSnapshot?: number | null;
      availabilitySnapshot?: string | null;
    }>;
  }) => Promise<{
    draftId: string;
    items: Array<{
      productId: string;
      quantity: number;
      priceSnapshot: number;
      currency: string;
      availabilitySnapshot: string;
    }>;
    removedItems: Array<{ productId: string; reason: "insufficient" | "missing" }>;
  }>;
  getActiveDraft: (params: { userId: string }) => Promise<{
    draftId: string;
    items: Array<{
      productId: string;
      quantity: number;
      priceSnapshot: number;
      currency: string;
      availabilitySnapshot: string;
      name: string | null;
      slug: string | null;
      imageUrl: string | null;
      game: string | null;
    }>;
  } | null>;
  revalidate: (params: { items: Array<{ productId: string; quantity: number }> }) => Promise<{
    items: Array<{
      productId: string;
      quantity: number;
      priceSnapshot: number;
      currency: string;
      availabilitySnapshot: string;
    }>;
    removedItems: Array<{ productId: string; reason: "insufficient" | "missing" }>;
  }>;
  createOrder: (params: {
    userId: string;
    draftId: string;
    paymentMethod: "PAY_IN_STORE";
    pickupBranchId: string | null;
  }) => Promise<{ orderId: string; status: string; expiresAt: string }>;
  getOrder: (params: { userId: string; orderId: string }) => Promise<Record<string, unknown> | null>;
};

export function createCheckoutUseCases(deps: {
  checkoutRepository: CheckoutRepository;
  emailService?: EmailService;
}): CheckoutUseCases {
  return {
    createDraft: (params) => deps.checkoutRepository.createOrUpdateDraft(params),
    getActiveDraft: (params) => deps.checkoutRepository.getActiveDraft(params),
    revalidate: (params) => deps.checkoutRepository.revalidateItems(params),
    async createOrder(params) {
      const created = await deps.checkoutRepository.createOrder(params);
      const customerEmail = created.customerEmail;
      if (customerEmail) {
        void (async () => {
          const resolvedLocale = resolveLocaleString(created.customerEmailLocale, LOCALE.ES_MX);
          const mail = await renderOrderCreatedEmail({
            locale: resolvedLocale,
            orderId: created.orderId,
            status: created.status,
            subtotal: created.subtotal,
            currency: created.currency,
            expiresAt: created.expiresAt,
            pickupBranchName: created.pickupBranchName
          });
          await deps.emailService?.sendEmail({
            to: customerEmail,
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
            meta: {
              userId: created.customerId,
              template: "OrderCreatedEmail",
              locale: resolvedLocale,
              orderId: created.orderId
            }
          });
        })();
      }
      return {
        orderId: created.orderId,
        status: created.status,
        expiresAt: created.expiresAt
      };
    },
    getOrder: (params) => deps.checkoutRepository.getOrder(params)
  };
}
