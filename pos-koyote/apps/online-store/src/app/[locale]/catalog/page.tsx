import { getTranslations, setRequestLocale } from "next-intl/server";

import { fetchCatalog, type InventoryState } from "@/lib/api";
import { ActiveFilterChips } from "@/components/catalog/active-filter-chips";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { CatalogFilters } from "@/components/catalog/catalog-filters";

type CatalogPageProps = {
  params: {
    locale: string;
  };
  searchParams: {
    page?: string;
    pageSize?: string;
    query?: string;
    category?: string;
    availability?: string;
    game?: string;
    priceMin?: string;
    priceMax?: string;
  };
};

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegative(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  setRequestLocale(params.locale);
  const t = await getTranslations();
  const page = parseNumber(searchParams.page, 1);
  const pageSize = parseNumber(searchParams.pageSize, 12);
  const query = searchParams.query ?? "";
  const category = searchParams.category ?? "";
  const availability = searchParams.availability ?? "";
  const game = searchParams.game ?? "";
  const priceMin = parseNonNegative(searchParams.priceMin);
  const priceMax = parseNonNegative(searchParams.priceMax);

  let data;
  try {
    data = await fetchCatalog({
      page,
      pageSize,
      query,
      category,
      availability,
      game,
      priceMin: searchParams.priceMin ? priceMin : undefined,
      priceMax: searchParams.priceMax ? priceMax : undefined
    });
  } catch (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-base-800 p-6 text-sm text-white/70">
        {t("catalog.error")}
      </div>
    );
  }

  const inventoryLabelFor = (state: InventoryState | null | undefined) => {
    switch (state) {
      case "AVAILABLE":
        return t("availability.available");
      case "LOW_STOCK":
        return t("availability.low");
      case "SOLD_OUT":
        return t("availability.soldOut");
      default:
        return t("availability.pending");
    }
  };

  const filteredItems = data.items.filter((product) => {
    const matchesCategory = category
      ? (product.category ?? "").toLowerCase().includes(category.toLowerCase())
      : true;
    const state = product.state ?? "PENDING_SYNC";
    const matchesAvailability = availability ? state === availability : true;
    const matchesGame = game ? product.game === game : true;
    const priceValue = product.price?.amount ?? null;
    const hasPriceFilter = searchParams.priceMin || searchParams.priceMax;
    const matchesPrice = hasPriceFilter
      ? priceValue !== null &&
        (searchParams.priceMin ? priceValue >= priceMin : true) &&
        (searchParams.priceMax ? priceValue <= priceMax : true)
      : true;
    return matchesCategory && matchesAvailability && matchesGame && matchesPrice;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("catalog.title")}</h1>
          <p className="text-sm text-white/60">{t("catalog.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <div className="md:sticky md:top-24 md:self-start">
          <CatalogFilters />
        </div>

        <div className="space-y-6">
          <ActiveFilterChips />
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-base-800 p-6 text-sm text-white/60">
              {t("catalog.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredItems.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  inventoryLabel={inventoryLabelFor(product.state)}
                />
              ))}
            </div>
          )}

          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            basePath="/catalog"
            query={{
              pageSize: data.pageSize,
              query,
              category,
              availability,
              game,
              priceMin: searchParams.priceMin,
              priceMax: searchParams.priceMax
            }}
            labels={{
              label: t("common.pagination.label", {
                page: data.page,
                total: Math.max(1, Math.ceil(data.total / data.pageSize))
              }),
              prev: t("common.pagination.prev"),
              next: t("common.pagination.next")
            }}
          />
        </div>
      </div>
    </div>
  );
}
