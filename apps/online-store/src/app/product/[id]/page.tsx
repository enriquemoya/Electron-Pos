import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchCatalog } from "@/lib/api";
import { InventoryBadge } from "@/components/inventory-badge";
import { Button } from "@/components/ui/button";

type ProductDetailPageProps = {
  params: { id: string };
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  let data;
  try {
    data = await fetchCatalog({ id: params.id, pageSize: 1 });
  } catch (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-base-800 p-6 text-sm text-white/70">
        Unable to load this product right now. Please try again later.
      </div>
    );
  }

  const product = data.items[0];
  if (!product) {
    notFound();
  }

  const isSoldOut = product.state === "SOLD_OUT";
  const priceLabel = product.price
    ? `${(product.price.amount / 100).toFixed(2)} ${product.price.currency}`
    : "Contact for price";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-base-800">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <InventoryBadge state={product.state ?? "PENDING_SYNC"} />
          <h1 className="text-3xl font-semibold text-white">{product.name}</h1>
          <p className="text-sm text-white/60">{product.category ?? "Premium TCG collectible"}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-base-800/70 p-4">
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>Price</span>
            <span className="text-lg font-semibold text-white">{priceLabel}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={isSoldOut}>
            {isSoldOut ? "Unavailable" : "Add to cart"}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/catalog">Browse catalog</Link>
          </Button>
        </div>

        <div className="rounded-xl border border-white/10 bg-base-800 p-4 text-sm text-white/60">
          Inventory availability reflects the latest known status and may change at checkout.
        </div>
      </div>
    </div>
  );
}
