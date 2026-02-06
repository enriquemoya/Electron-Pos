export type InventoryState = "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT" | "PENDING_SYNC";

export type ProductListItem = {
  id: string;
  slug?: string | null;
  name: string;
  shortDescription?: string | null;
  category?: string | null;
  game?: string | null;
  price?: { amount: number; currency: string } | null;
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

export type FeaturedProduct = {
  id: string;
  slug: string | null;
  name: string | null;
  game: "pokemon" | "one-piece" | "yugioh" | "other";
  imageUrl: string | null;
  price: number | null;
  currency: "MXN";
  availability: "in_stock" | "low_stock" | "out_of_stock";
  featuredOrder: number | null;
};

export type FeaturedProductResponse = {
  items: FeaturedProduct[];
  meta: { total: number };
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
  game?: string;
  priceMin?: number;
  priceMax?: number;
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

  const data = (await response.json()) as ProductListResponse;
  return {
    ...data,
    items: (data.items ?? []).map((item) => ({
      ...item,
      name: item?.name ?? ""
    }))
  };
}

export async function fetchFeaturedProducts(): Promise<{
  items: ProductListItem[];
}> {
  const baseUrl = process.env.CLOUD_API_URL;
  const secret = process.env.CLOUD_SHARED_SECRET;

  if (!baseUrl) {
    throw new Error("CLOUD_API_URL is required.");
  }

  const url = `${baseUrl}/api/cloud/catalog/featured`;
  const response = await fetch(url, {
    headers: {
      "x-cloud-secret": secret || ""
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("featured request failed");
  }

  const data = (await response.json()) as FeaturedProductResponse;
  const mapped = data.items.map((item) => {
    const state: InventoryState =
      item.availability === "in_stock"
        ? "AVAILABLE"
        : item.availability === "low_stock"
          ? "LOW_STOCK"
          : "SOLD_OUT";

    return {
      id: item.id,
      slug: item.slug,
      name: item.name ?? "",
      category: null,
      price: item.price ? { amount: item.price, currency: item.currency } : null,
      state,
      imageUrl: item.imageUrl ?? null
    };
  });

  return { items: mapped };
}
