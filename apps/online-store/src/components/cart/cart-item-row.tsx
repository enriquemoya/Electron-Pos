"use client";

import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import type { CartItem } from "@/lib/cart";
import { formatMoney } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";
import { cn } from "@/lib/utils";

export function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  imageFallbackAlt,
  className
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  imageFallbackAlt: string;
  className?: string;
}) {
  const t = useTranslations();
  const isOutOfStock = item.availability === "out_of_stock";
  const isPending = item.availability === "pending_sync";
  const isUnknown = item.availability === "unknown";
  const showWarning = isPending || isUnknown;

  const priceLabel = item.price === null
    ? t("cart.priceUnavailable")
    : formatMoney(item.price, item.currency);

  const warningLabel = isPending
    ? t("cart.warnings.pending")
    : isUnknown
      ? t("cart.warnings.unknown")
      : "";

  return (
    <div className={cn("flex gap-4 rounded-2xl border border-white/10 bg-base-800/60 p-4", className)}>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-base-900">
        <ProductImage
          src={item.imageUrl}
          alt={item.name}
          fallbackAlt={imageFallbackAlt}
          sizes="64px"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{item.name}</p>
            {item.game ? <p className="text-xs text-white/60">{item.game}</p> : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={t("cart.actions.remove")}
            className="text-white/60 hover:text-white"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">{priceLabel}</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onDecrement}
              aria-label={t("cart.actions.decrement")}
              className="h-8 w-8 border-white/10"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="min-w-[1.5rem] text-center text-sm text-white">{item.quantity}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onIncrement}
              aria-label={t("cart.actions.increment")}
              className="h-8 w-8 border-white/10"
              disabled={isOutOfStock}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {isOutOfStock ? (
          <div className="text-xs text-rose-200">{t("cart.warnings.outOfStock")}</div>
        ) : null}

        {showWarning ? (
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{warningLabel}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
