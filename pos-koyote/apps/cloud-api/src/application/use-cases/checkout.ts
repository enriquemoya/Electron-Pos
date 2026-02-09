import type { CheckoutRepository } from "../ports";

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

export function createCheckoutUseCases(deps: { checkoutRepository: CheckoutRepository }): CheckoutUseCases {
  return {
    createDraft: (params) => deps.checkoutRepository.createOrUpdateDraft(params),
    getActiveDraft: (params) => deps.checkoutRepository.getActiveDraft(params),
    revalidate: (params) => deps.checkoutRepository.revalidateItems(params),
    createOrder: (params) => deps.checkoutRepository.createOrder(params),
    getOrder: (params) => deps.checkoutRepository.getOrder(params)
  };
}
