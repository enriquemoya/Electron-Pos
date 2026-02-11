"use client";

import type { MouseEvent } from "react";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import type { CartItemInput } from "@/lib/cart";

export function AddToCartButton({
  item,
  className,
  disabled = false,
  onBeforeAdd
}: {
  item: CartItemInput;
  className?: string;
  disabled?: boolean;
  onBeforeAdd?: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const t = useTranslations();
  const { addItem } = useCart();

  return (
    <Button
      type="button"
      className={className}
      disabled={disabled}
      onClick={(event) => {
        onBeforeAdd?.(event);
        if (event.defaultPrevented || disabled) {
          return;
        }
        try {
          addItem(item);
          toast.success(t("toast.addToCart.success"));
        } catch {
          toast.error(t("toast.addToCart.error"));
        }
      }}
    >
      <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
      {t("cart.actions.add")}
    </Button>
  );
}
