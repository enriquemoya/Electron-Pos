import { getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/product-card";
import { FeaturedSkeleton } from "@/components/landing/featured-skeleton";
import { fetchFeaturedProducts } from "@/lib/api";

type FeaturedGridProps = {
  emptyLabel: string;
  errorLabel: string;
};

export async function FeaturedGrid({ emptyLabel, errorLabel }: FeaturedGridProps) {
  const t = await getTranslations();
  try {
    const data = await fetchFeaturedProducts();
    if (!data.items.length) {
      return <p className="text-sm text-white/60">{emptyLabel}</p>;
    }

    const labelFor = (state: string | null | undefined) => {
      switch (state) {
        case "AVAILABLE":
          return t("availability.inStock");
        case "LOW_STOCK":
          return t("availability.lowStock");
        case "SOLD_OUT":
          return t("availability.outOfStock");
        default:
          return t("availability.outOfStock");
      }
    };

    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            inventoryLabel={labelFor(product.state)}
          />
        ))}
      </div>
    );
  } catch {
    return <p className="text-sm text-red-300">{errorLabel}</p>;
  }
}

export { FeaturedSkeleton };
