"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { useCart } from "@/components/cart/cart-context";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { formatMoney } from "@/lib/cart";
import { Link } from "@/navigation";

export function Cart() {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();
  const hasItems = items.length > 0;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="relative"
          aria-label={t("navigation.cart.label")}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t("navigation.cart.label")}</span>
          {itemCount ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-accent-500 px-1.5 text-[0.65rem] text-white">
              {itemCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent classNameOverlay="w-full sm:w-fit" className="right-0 w-full max-w-none sm:left-auto sm:right-0 sm:w-fit sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("cart.drawer.title")}</SheetTitle>
        </SheetHeader>

        {hasItems ? (
          <div className="mt-6 flex h-full flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-auto pr-1">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  imageFallbackAlt={t("cart.imageFallbackAlt")}
                  onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
                  onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>{t("cart.summary.subtotal")}</span>
                <span className="text-white">{formatMoney(subtotal, "MXN")}</span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <SheetClose asChild>
                  <Button asChild className="w-full">
                    <Link href="/cart">{t("cart.actions.viewCart")}</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild variant="outline" className="w-full border-white/10">
                    <Link href="/checkout">{t("cart.actions.checkout")}</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild variant="outline" className="w-full border-white/10">
                    <Link href="/catalog">{t("cart.actions.continueShopping")}</Link>
                  </Button>
                </SheetClose>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-4 text-center text-sm text-white/60">
            <p className="text-base font-semibold text-white">{t("cart.empty.title")}</p>
            <p>{t("cart.empty.subtitle")}</p>
            <SheetClose asChild>
              <Button asChild className="mt-2">
                <Link href="/catalog">{t("cart.actions.continueShopping")}</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
