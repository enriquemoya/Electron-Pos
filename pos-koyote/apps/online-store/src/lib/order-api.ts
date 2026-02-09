import "server-only";

import { cookies } from "next/headers";

export type CustomerOrderListItem = {
  id: string;
  status: string;
  subtotal: number;
  currency: string;
  paymentMethod: string;
  expiresAt: string;
  createdAt: string;
  statusUpdatedAt: string;
  pickupBranch: { name: string; city: string } | null;
};

export type CustomerOrderDetail = {
  id: string;
  status: string;
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
  }>;
  timeline: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    actorUserId: string | null;
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
