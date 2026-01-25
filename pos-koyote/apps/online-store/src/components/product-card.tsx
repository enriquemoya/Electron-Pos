import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { InventoryBadge } from "@/components/inventory-badge";
import type { ProductListItem } from "@/lib/api";
import { Link } from "@/navigation";

export function ProductCard({
  product,
  inventoryLabel,
  viewLabel
}: {
  product: ProductListItem;
  inventoryLabel: string;
  viewLabel: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full bg-base-700">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : null}
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
            {product.price ? `${(product.price.amount / 100).toFixed(2)} ${product.price.currency}` : ""}
          </span>
          <Link href={`/product/${product.id}`} className="text-xs text-accent-500 hover:text-accent-600">
            {viewLabel}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
