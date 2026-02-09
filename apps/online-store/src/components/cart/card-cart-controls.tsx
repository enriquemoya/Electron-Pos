"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import { Minus, Plus, ShoppingCart, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import type { CartItemInput } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/cart/cart-context";

export function CardCartControls({ item }: { item: CartItemInput }) {
  const t = useTranslations();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const availability = item.availability ?? "unknown";
  const isOutOfStock = availability === "out_of_stock";
  const showPending = availability === "pending_sync";
  const showUnknown = availability === "unknown";

  const clamp = (value: number) => Math.max(1, Math.floor(value));

  const increment = () => {
    if (isOutOfStock) {
      return;
    }
    setQuantity((prev) => clamp(prev + 1));
  };

  const decrement = () => {
    setQuantity((prev) => clamp(prev - 1));
  };

  const onInputChange = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    setQuantity(clamp(parsed));
  };

  const warningLabel = showPending
    ? t("cart.warnings.pending")
    : showUnknown
      ? t("cart.warnings.unknown")
      : "";

  const blockLink = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="space-y-2" onClick={blockLink}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={(event) => {
            blockLink(event);
            decrement();
          }}
          aria-label={t("cart.actions.decrement")}
          className="h-8 w-8 border-white/10"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => onInputChange(event.target.value)}
          onBlur={() => setQuantity((prev) => clamp(prev))}
          onClick={blockLink}
          className="h-8 w-14 border-white/10 bg-base-900 text-center text-sm text-white"
          aria-label={t("cart.quantity.label")}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={(event) => {
            blockLink(event);
            increment();
          }}
          aria-label={t("cart.actions.increment")}
          className="h-8 w-8 border-white/10"
          disabled={isOutOfStock}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon"
          onClick={(event) => {
            blockLink(event);
            addItem({ ...item, quantity });
          }}
          aria-label={t("cart.actions.add")}
          className="h-8 w-8 bg-accent-500 text-base-900 hover:bg-accent-400"
          disabled={isOutOfStock}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {isOutOfStock ? (
        <span className="text-xs text-rose-200">{t("cart.warnings.outOfStock")}</span>
      ) : null}

      {warningLabel ? (
        <div className="flex items-center gap-2 text-xs text-amber-200">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{warningLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
