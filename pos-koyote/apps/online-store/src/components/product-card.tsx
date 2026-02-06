"use client";

import { Card, CardContent } from "@/components/ui/card";
import { InventoryBadge } from "@/components/inventory-badge";
import { ProductImage } from "@/components/product-image";
import type { ProductListItem } from "@/lib/api";
import { Link } from "@/navigation";

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function ProductCard({
  product,
  inventoryLabel,
  imageAlt,
  imageFallbackAlt
}: {
  product: ProductListItem;
  inventoryLabel: string;
  imageAlt: string;
  imageFallbackAlt: string;
}) {
  // PDP v1 uses the product id as the route param value (see PDP spec).
  const detailSlug = product.id;

  return (
    <Link href={`/product/${detailSlug}`} className="group block">
      <Card className="overflow-hidden transition hover:border-white/15 hover:bg-base-800/40">
        <div className="relative h-48 w-full bg-base-700">
          <ProductImage
            src={product.imageUrl}
            alt={imageAlt}
            fallbackAlt={imageFallbackAlt}
            className="object-cover"
          />
        </div>
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{product.name}</h3>
              {product.category ? (
                <p className="text-xs text-white/60">{product.category}</p>
              ) : null}
            </div>
            <InventoryBadge state={product.state ?? "PENDING_SYNC"} label={inventoryLabel} />
          </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm text-white/80">
            {product.price ? formatMoney(product.price.amount, product.price.currency) : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  </Link>
  );
}
