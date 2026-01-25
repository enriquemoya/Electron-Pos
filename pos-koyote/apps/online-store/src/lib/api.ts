export type InventoryState = "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT" | "PENDING_SYNC";

export type ProductListItem = {
  id: string;
  name: string;
  shortDescription?: string | null;
  category?: string | null;
  price?: { amount: number; currency: string } | null;
  gameTypeId?: string | null;
  expansionId?: string | null;
  available?: number | null;
  state?: InventoryState | null;
  lastSyncedAt?: string | null;
  updatedAt?: string | null;
  imageUrl?: string | null;
};

export type ProductListResponse = {
  items: ProductListItem[];
  page: number;
  pageSize: number;
  total: number;
};

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function fetchCatalog(params: {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: string;
  availability?: string;
  gameTypeId?: string;
  expansionId?: string;
  id?: string;
}): Promise<ProductListResponse> {
  const baseUrl = process.env.CLOUD_API_URL;
  const secret = process.env.CLOUD_SHARED_SECRET;

  if (!baseUrl) {
    throw new Error("CLOUD_API_URL is required.");
  }

  const url = `${baseUrl}/read/products${buildQuery(params)}`;
  const response = await fetch(url, {
    headers: {
      "x-cloud-secret": secret || ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("catalog request failed");
  }

  return response.json();
}
