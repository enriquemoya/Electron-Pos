import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { fetchCatalog } from "@/lib/api";
import { InventoryBadge } from "@/components/inventory-badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";

type ProductDetailPageProps = {
  params: { id: string };
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const t = await getTranslations();

  let data;
  try {
    data = await fetchCatalog({ id: params.id, pageSize: 1 });
  } catch (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-base-800 p-6 text-sm text-white/70">
        {t("product.error")}
      </div>
    );
  }

  const product = data.items[0];
  if (!product) {
    notFound();
  }

  const inventoryLabel = (() => {
    switch (product.state) {
      case "AVAILABLE":
        return t("availability.available");
      case "LOW_STOCK":
        return t("availability.low");
      case "SOLD_OUT":
        return t("availability.soldOut");
      default:
        return t("availability.pending");
    }
  })();

  const isSoldOut = product.state === "SOLD_OUT";
  const priceLabel = product.price
    ? `${(product.price.amount / 100).toFixed(2)} ${product.price.currency}`
    : t("product.contactPrice");

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-base-800">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <InventoryBadge state={product.state ?? "PENDING_SYNC"} label={inventoryLabel} />
          <h1 className="text-3xl font-semibold text-white">{product.name}</h1>
          {product.category ? (
            <p className="text-sm text-white/60">{product.category}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-base-800/70 p-4">
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>{t("product.priceLabel")}</span>
            <span className="text-lg font-semibold text-white">{priceLabel}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={isSoldOut}>
            {isSoldOut ? t("product.unavailable") : t("product.addToCart")}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/catalog">{t("product.browseCatalog")}</Link>
          </Button>
        </div>

        {product.shortDescription ? (
          <div className="rounded-xl border border-white/10 bg-base-800 p-4 text-sm text-white/70">
            {product.shortDescription}
          </div>
        ) : null}

        <div className="rounded-xl border border-white/10 bg-base-800 p-4 text-sm text-white/60">
          {t("product.inventoryNote")}
        </div>
      </div>
    </div>
  );
}
