import { getTranslations } from "next-intl/server";

import { fetchCatalog, type InventoryState } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CatalogPageProps = {
  searchParams: {
    page?: string;
    pageSize?: string;
    query?: string;
    category?: string;
    availability?: string;
  };
};

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const t = await getTranslations();
  const page = parseNumber(searchParams.page, 1);
  const pageSize = parseNumber(searchParams.pageSize, 12);
  const query = searchParams.query ?? "";
  const category = searchParams.category ?? "";
  const availability = searchParams.availability ?? "";

  let data;
  try {
    data = await fetchCatalog({
      page,
      pageSize,
      query,
      category,
      availability
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
    return matchesCategory && matchesAvailability;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("catalog.title")}</h1>
          <p className="text-sm text-white/60">{t("catalog.subtitle")}</p>
        </div>
      </div>

      <form className="grid gap-3 rounded-xl border border-white/10 bg-base-800/60 p-4 md:grid-cols-4">
        <Input name="query" placeholder={t("catalog.searchPlaceholder")} defaultValue={query} />
        <Input name="category" placeholder={t("catalog.categoryPlaceholder")} defaultValue={category} />
        <select
          name="availability"
          defaultValue={availability}
          className="h-10 w-full rounded-md border border-white/10 bg-base-800 px-3 text-sm text-white/80"
        >
          <option value="">{t("catalog.availabilityPlaceholder")}</option>
          <option value="AVAILABLE">{t("availability.available")}</option>
          <option value="LOW_STOCK">{t("availability.low")}</option>
          <option value="SOLD_OUT">{t("availability.soldOut")}</option>
          <option value="PENDING_SYNC">{t("availability.pending")}</option>
        </select>
        <div className="flex gap-2">
          <Button type="submit" variant="outline" className="w-full">
            {t("catalog.applyFilters")}
          </Button>
        </div>
      </form>

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
              viewLabel={t("product.view")}
            />
          ))}
        </div>
      )}

      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        basePath="/catalog"
        query={{ pageSize: data.pageSize, query, category, availability }}
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
  );
}
