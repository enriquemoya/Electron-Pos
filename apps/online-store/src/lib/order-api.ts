import "server-only";

import { cookies } from "next/headers";

export type CustomerOrderListItem = {
  id: string;
  orderNumber: number;
  orderCode: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  currency: string;
  paymentMethod: string;
  expiresAt: string;
  createdAt: string;
  statusUpdatedAt: string;
  pickupBranch: { name: string; city: string } | null;
  totals?: {
    subtotalCents: number;
    refundsCents: number;
    totalCents: number;
    currency: string;
  };
  totalsBreakdown?: {
    items: Array<{ productName: string; qty: number; lineTotalCents: number }>;
    refunds: Array<{
      productName: string;
      amountCents: number;
      type: "FULL" | "PARTIAL";
      method: "CASH" | "CARD" | "STORE_CREDIT" | "TRANSFER" | "OTHER";
    }>;
  };
};

export type CustomerOrderDetail = {
  id: string;
  orderNumber: number;
  orderCode: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  currency: string;
  paymentMethod: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  statusUpdatedAt: string;
  pickupBranch: {
    id: string;
    name: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    imageUrl: string | null;
  } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    priceSnapshot: number;
    currency: string;
    availabilitySnapshot: string;
    refundState?: "NONE" | "PARTIAL" | "FULL";
  }>;
  refunds?: Array<{
    id: string;
    orderItemId: string | null;
    amount: number;
    currency: string;
    refundMethod: "CASH" | "CARD" | "STORE_CREDIT" | "TRANSFER" | "OTHER";
    adminDisplayName: string;
    adminMessage: string;
    createdAt: string;
  }>;
  totals?: {
    subtotal: number;
    refundsTotal: number;
    finalTotal: number;
    paidTotal: number;
    balanceDue: number;
  };
  timeline: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    approvedByAdminName?: string | null;
    adminMessage?: string | null;
    actorDisplayName?: string | null;
    actorType?: "ADMIN" | "SYSTEM" | null;
    createdAt: string;
  }>;
};

function getAuthHeaders() {
  const token = cookies().get("auth_access")?.value;
  if (!token) {
    throw new Error("unauthorized");
  }

  return {
    authorization: `Bearer ${token}`,
    "x-cloud-secret": process.env.CLOUD_SHARED_SECRET || ""
  };
}

function getBaseUrl() {
  const baseUrl = process.env.CLOUD_API_URL;
  if (!baseUrl) {
    throw new Error("CLOUD_API_URL is required");
  }
  return baseUrl;
}

export async function fetchCustomerOrders(params: { page: number; pageSize: number }) {
  const url = new URL(`${getBaseUrl()}/orders`);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("pageSize", String(params.pageSize));

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`customer orders request failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<{
    items: CustomerOrderListItem[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  }>;
}

export async function fetchCustomerOrder(orderId: string) {
  const response = await fetch(`${getBaseUrl()}/orders/${orderId}`, {
    headers: getAuthHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`customer order request failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<{ order: CustomerOrderDetail }>;
}
