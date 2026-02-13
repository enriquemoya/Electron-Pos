export type InventoryState = "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT" | "PENDING_SYNC";

export type ProductListItem = {
  id: string;
  slug?: string | null;
  name: string;
  shortDescription?: string | null;
  category?: string | null;
  categoryId?: string | null;
  game?: string | null;
  gameId?: string | null;
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

export type TaxonomyItem = {
  id: string;
  slug: string;
  type: "GAME" | "CATEGORY" | "EXPANSION";
  name: string;
  labels: { es: string | null; en: string | null };
  parentId: string | null;
  releaseDate?: string | null;
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
  gameId?: string;
  categoryId?: string;
  expansionId?: string;
  misc?: boolean;
  priceMin?: number;
  priceMax?: number;
  id?: string;
}): Promise<ProductListResponse> {
  const baseUrl = getCloudApiUrl();
  const secret = getCloudSecret();

  if (!baseUrl) {
    throw new Error("CLOUD_API_URL is required.");
  }

  const queryParams: Record<string, string | number | undefined> = {
    page: params.page,
    pageSize: params.pageSize,
    id: params.id,
    gameId: params.misc ? "misc" : params.gameId,
    categoryId: params.categoryId,
    expansionId: params.expansionId,
    priceMin: params.priceMin,
    priceMax: params.priceMax
  };

  const url = `${baseUrl}/read/products${buildQuery(queryParams)}`;
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
  const baseUrl = getCloudApiUrl();
  const secret = getCloudSecret();

  if (!baseUrl) {
    throw new Error("CLOUD_API_URL is required.");
  }

  const url = `${baseUrl}/api/cloud/catalog/featured`;
  const response = await fetch(url, {
    headers: {
      "x-cloud-secret": secret || ""
    },
    next: { revalidate: 300 }
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

async function fetchTaxonomyEndpoint(path: string): Promise<TaxonomyItem[]> {
  const baseUrl = getCloudApiUrl();
  const secret = getCloudSecret();
  if (!baseUrl) {
    throw new Error("CLOUD_API_URL is required.");
  }

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: secret ? { "x-cloud-secret": secret } : undefined,
        next: { revalidate: 3600 }
      });

      if (response.ok) {
        const payload = (await response.json()) as { items?: TaxonomyItem[] };
        return payload.items ?? [];
      }

      const detail = await response.text();
      if (response.status >= 500 && attempt === 0) {
        continue;
      }
      throw new Error(
        `taxonomy request failed (${response.status})${detail ? `: ${detail}` : ""}`
      );
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        continue;
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("taxonomy request failed");
}

export async function fetchTaxonomyGames() {
  return fetchTaxonomyEndpoint("/catalog/taxonomies/games");
}

export async function fetchTaxonomyCategories() {
  return fetchTaxonomyEndpoint("/catalog/taxonomies/categories");
}

export async function fetchTaxonomyCategoriesByGame(gameId?: string) {
  const query = gameId ? `?gameId=${encodeURIComponent(gameId)}` : "";
  return fetchTaxonomyEndpoint(`/catalog/taxonomies/categories${query}`);
}

export async function fetchTaxonomyExpansions(gameId?: string) {
  const query = gameId ? `?gameId=${encodeURIComponent(gameId)}` : "";
  return fetchTaxonomyEndpoint(`/catalog/taxonomies/expansions${query}`);
}
import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";
