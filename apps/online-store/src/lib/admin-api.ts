import "server-only";

import { cookies } from "next/headers";

type AdminUser = {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  role: "CUSTOMER" | "ADMIN";
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
};

type UsersResponse = {
  items: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type UserResponse = { user: AdminUser };

type AdminSummary = { pendingShipments: number; onlineSalesTotal: number; currency: string };

type InventoryItem = {
  productId: string;
  displayName: string | null;
  slug: string | null;
  category: string | null;
  game: string | null;
  available: number;
  price: number | null;
  imageUrl: string | null;
};

type InventoryResponse = {
  items: InventoryItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type CatalogProduct = {
  productId: string;
  displayName: string | null;
  slug: string | null;
  category: string | null;
  categoryId?: string | null;
  gameId?: string | null;
  expansionId?: string | null;
  game: string | null;
  price: number | null;
  imageUrl: string | null;
  shortDescription: string | null;
  description?: string | null;
  rarity?: string | null;
  tags?: string[] | null;
  availabilityState: string | null;
  isFeatured: boolean;
  featuredOrder: number | null;
  isActive?: boolean;
  available: number;
};

type CatalogProductsResponse = {
  items: CatalogProduct[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type Taxonomy = {
  id: string;
  type: "CATEGORY" | "GAME" | "EXPANSION" | "OTHER";
  name: string;
  slug: string;
  parentId: string | null;
  releaseDate: string | null;
  labels: { es: string | null; en: string | null } | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type PickupBranch = {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type TerminalStatus = "PENDING" | "ACTIVE" | "REVOKED";

type AdminTerminal = {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  branchCity: string | null;
  status: TerminalStatus;
  revokedAt: string | null;
  revokedByAdminId: string | null;
  revokedByAdminName: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminTerminalCreateResponse = {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  status: TerminalStatus;
  activationApiKey: string;
  createdAt: string;
};

type AdminProofMedia = {
  id: string;
  branchId: string;
  terminalId: string;
  saleId: string | null;
  key: string;
  url: string;
  mime: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

type AdminProofMediaResponse = {
  items: AdminProofMedia[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type OrderStatus =
  | "CREATED"
  | "PENDING_PAYMENT"
  | "PAID"
  | "PAID_BY_TRANSFER"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "SHIPPED"
  | "CANCELLED_REFUNDED"
  | "CANCELLED_EXPIRED"
  | "CANCELLED_MANUAL"
  | "CANCELED";

type RefundMethod = "CASH" | "CARD" | "STORE_CREDIT" | "TRANSFER" | "OTHER";

type AdminOrderListItem = {
  id: string;
  orderNumber: number;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: string;
  subtotal: number;
  currency: string;
  paymentMethod: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  statusUpdatedAt: string;
  customer: { email: string | null; name: string | null };
  totals?: {
    subtotal: number;
    refundsTotal: number;
    finalTotal: number;
    paidTotal: number;
    balanceDue: number;
  };
  totalsBreakdown?: {
    items: Array<{ id: string; label: string; quantity: number; amount: number; currency: string }>;
    refunds: Array<{ orderItemId: string | null; label: string; state: "FULL" | "PARTIAL"; amount: number }>;
  };
  pickupBranch: { name: string; city: string } | null;
};

type AdminOrderDetail = {
  id: string;
  orderNumber: number;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: string;
  subtotal: number;
  currency: string;
  paymentMethod: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  statusUpdatedAt: string;
  cancelReason: string | null;
  customer: {
    id: string;
    email: string | null;
    name: string | null;
  };
  pickupBranch: PickupBranch | null;
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
    refundMethod: RefundMethod;
    adminId?: string | null;
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
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    reason: string | null;
    approvedByAdminId?: string | null;
    approvedByAdminName?: string | null;
    adminMessage?: string | null;
    actor: { id: string; email: string | null; name: string | null } | null;
    createdAt: string;
  }>;
};

type AdminOrdersResponse = {
  items: AdminOrderListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

function getBaseUrl() {
  const baseUrl = process.env.CLOUD_API_URL;
  if (!baseUrl) {
    throw new Error("CLOUD_API_URL is required.");
  }
  return baseUrl;
}

function getSecret() {
  return process.env.CLOUD_SHARED_SECRET || "";
}

function getAccessToken() {
  return cookies().get("auth_access")?.value || "";
}

function withQuery(url: URL, params: Record<string, string | number | undefined>) {
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url;
}

export async function fetchAdminUsers(page: number, pageSize: number): Promise<UsersResponse> {
  const baseUrl = getBaseUrl();
  const url = new URL(`${baseUrl}/admin/users`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));

  const response = await fetch(url.toString(), {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("admin users request failed");
  }

  return response.json();
}

export async function fetchAdminUser(id: string): Promise<UserResponse> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/users/${id}`, {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("admin user request failed");
  }

  return response.json();
}

export async function updateAdminUser(
  id: string,
  data: {
    role: "CUSTOMER" | "ADMIN";
    status: "ACTIVE" | "DISABLED";
  }
): Promise<UserResponse> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/users/${id}`, {
    method: "PATCH",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      "content-type": "application/json"
    },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("admin user update failed");
  }

  return response.json();
}

export async function fetchAdminSummary(): Promise<AdminSummary> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/dashboard/summary`, {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("admin summary request failed");
  }

  return response.json();
}

export async function fetchAdminProofMedia(params: {
  branchId?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminProofMediaResponse> {
  const baseUrl = getBaseUrl();
  const url = withQuery(new URL(`${baseUrl}/admin/media/proofs`), {
    branchId: params.branchId,
    q: params.q,
    from: params.from,
    to: params.to,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20
  });

  const response = await fetch(url.toString(), {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("admin proof media request failed");
  }
  return response.json();
}

export async function fetchInventory(params: {
  page: number;
  pageSize: number;
  query?: string;
  sort?: string;
  direction?: string;
}): Promise<InventoryResponse> {
  const baseUrl = getBaseUrl();
  const url = withQuery(new URL(`${baseUrl}/admin/inventory`), params);

  const response = await fetch(url.toString(), {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("inventory request failed");
  }

  return response.json();
}

export async function adjustInventory(productId: string, data: { delta: number; reason: string }) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/inventory/${productId}/adjust`, {
    method: "POST",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      "content-type": "application/json"
    },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("inventory adjust failed");
  }

  return response.json();
}

export async function fetchCatalogProducts(params: {
  page: number;
  pageSize: number;
  query?: string;
  sort?: string;
  direction?: string;
}): Promise<CatalogProductsResponse> {
  const baseUrl = getBaseUrl();
  const url = withQuery(new URL(`${baseUrl}/admin/catalog/products`), params);

  const response = await fetch(url.toString(), {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("catalog products request failed");
  }

  return response.json();
}

export async function fetchAdminBranches(): Promise<PickupBranch[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/branches`, {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("branches request failed");
  }

  const data = (await response.json()) as { items: PickupBranch[] };
  return data.items ?? [];
}

export async function fetchAdminTerminals(): Promise<AdminTerminal[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/terminals`, {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("terminals request failed");
  }

  const data = (await response.json()) as { items?: AdminTerminal[] };
  return data.items ?? [];
}

export async function createAdminTerminal(data: {
  name: string;
  branchId: string;
}): Promise<AdminTerminalCreateResponse> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/terminals`, {
    method: "POST",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      "content-type": "application/json"
    },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`terminal create failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<AdminTerminalCreateResponse>;
}

export async function revokeAdminTerminal(id: string) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/terminals/${id}/revoke`, {
    method: "POST",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`terminal revoke failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<{ ok: boolean }>;
}

export async function createAdminBranch(data: {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
}) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/branches`, {
    method: "POST",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      "content-type": "application/json"
    },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`branch create failed (${response.status}): ${message}`);
  }

  return response.json();
}

export async function updateAdminBranch(
  id: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
  }
) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/branches/${id}`, {
    method: "PATCH",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      "content-type": "application/json"
    },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`branch update failed (${response.status}): ${message}`);
  }

  return response.json();
}

export async function deleteAdminBranch(id: string) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/branches/${id}`, {
    method: "DELETE",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("branch delete failed");
  }

  return response.json();
}

export async function fetchCatalogProduct(productId: string) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/catalog/products/${productId}`, {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("catalog product request failed");
  }

  return response.json() as Promise<{ product: CatalogProduct }>;
}

export async function createCatalogProduct(data: Record<string, unknown>) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/catalog/products`, {
    method: "POST",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      "content-type": "application/json"
    },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("catalog product create failed");
  }

  return response.json() as Promise<{ product: CatalogProduct }>;
}

export async function updateCatalogProduct(productId: string, data: Partial<CatalogProduct> & { reason: string }) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/catalog/products/${productId}`, {
    method: "PATCH",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      "content-type": "application/json"
    },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("catalog product update failed");
  }

  return response.json();
}

export async function fetchTaxonomies(params?: {
  type?: Taxonomy["type"];
  page?: number;
  pageSize?: number;
  query?: string;
  sort?: string;
  direction?: string;
}) {
  const baseUrl = getBaseUrl();
  const url = withQuery(new URL(`${baseUrl}/admin/catalog/taxonomies`), params ?? {});

  const response = await fetch(url.toString(), {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`taxonomies request failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<{ items: Taxonomy[]; total?: number; page?: number; pageSize?: number; hasMore?: boolean }>;
}

export async function createTaxonomy(data: {
  type: Taxonomy["type"];
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  releaseDate?: string | null;
  labels?: { es: string | null; en: string | null } | null;
}) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/catalog/taxonomies`, {
    method: "POST",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      "content-type": "application/json"
    },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`taxonomy create failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<{ taxonomy: Taxonomy }>;
}

export async function updateTaxonomy(id: string, data: {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  releaseDate?: string | null;
  labels?: { es: string | null; en: string | null } | null;
}) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/catalog/taxonomies/${id}`, {
    method: "PATCH",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      "content-type": "application/json"
    },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`taxonomy update failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<{ taxonomy: Taxonomy }>;
}

export async function deleteTaxonomy(id: string) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/catalog/taxonomies/${id}`, {
    method: "DELETE",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("taxonomy delete failed");
  }

  return response.json() as Promise<{ status: string }>;
}

export async function fetchAdminOrders(params: {
  page: number;
  pageSize: number;
  query?: string;
  status?: string;
  sort?: "createdAt" | "status" | "expiresAt" | "subtotal";
  direction?: "asc" | "desc";
}) {
  const baseUrl = getBaseUrl();
  const url = withQuery(new URL(`${baseUrl}/admin/orders`), {
    page: params.page,
    pageSize: params.pageSize,
    q: params.query,
    status: params.status,
    sort: params.sort,
    direction: params.direction
  });

  const response = await fetch(url.toString(), {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`admin orders request failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<AdminOrdersResponse>;
}

export async function fetchAdminOrder(orderId: string) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/orders/${orderId}`, {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`admin order request failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<{ order: AdminOrderDetail }>;
}

export async function transitionAdminOrderStatus(
  orderId: string,
  data: { toStatus: string; reason?: string; adminMessage?: string }
) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/orders/${orderId}/status`, {
    method: "POST",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      "content-type": "application/json"
    },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`order transition failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<{ orderId: string; fromStatus: string | null; toStatus: string }>;
}

export async function createAdminRefund(
  orderId: string,
  data: { orderItemId?: string; amount: number; refundMethod: RefundMethod; adminMessage: string }
) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/admin/orders/${orderId}/refunds`, {
    method: "POST",
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      "content-type": "application/json"
    },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`order refund failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<{ order: AdminOrderDetail }>;
}

export type {
  AdminUser,
  AdminSummary,
  InventoryItem,
  PickupBranch,
  CatalogProduct,
  Taxonomy,
  AdminTerminal,
  AdminTerminalCreateResponse,
  TerminalStatus,
  AdminOrderListItem,
  AdminOrderDetail,
  OrderStatus,
  RefundMethod
};
