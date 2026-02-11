"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { formatMoney } from "@/lib/cart";
import { Link } from "@/navigation";

export function CartPage() {
  const t = useTranslations();
  const { items, subtotal, updateQuantity, removeItem, clear, replaceItems } = useCart();
  const hasValidated = useRef(false);

  useEffect(() => {
    if (hasValidated.current || !items.length) {
      return;
    }
    hasValidated.current = true;

    const run = async () => {
      const response = await fetch("/api/checkout/revalidate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity }))
        })
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        validItems: Array<{
          productId: string;
          quantity: number;
          priceSnapshot: number;
          currency: string;
          availabilitySnapshot: string;
        }>;
        removedItems: Array<{ productId: string }>;
      };

      const nextItems = data.validItems
        .map((validated) => {
          const existing = items.find((item) => item.id === validated.productId);
          if (!existing) {
            return null;
          }
          return {
            ...existing,
            quantity: validated.quantity,
            price: validated.priceSnapshot,
            currency: validated.currency,
            availability: validated.availabilitySnapshot as typeof existing.availability
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      if (data.removedItems.length) {
        toast(t("checkout.revalidation.title"), {
          description: t("checkout.revalidation.removed")
        });
      }

      replaceItems(nextItems);
    };

    void run();
  }, [items, replaceItems, t, toast]);

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-base-800/60 p-10 text-center">
        <h1 className="text-2xl font-semibold text-white">{t("cart.page.title")}</h1>
        <p className="text-sm text-white/60">{t("cart.empty.subtitle")}</p>
        <Button asChild className="mt-2">
          <Link href="/catalog">{t("cart.actions.continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("cart.page.title")}</h1>
          <p className="text-sm text-white/60">{t("cart.page.subtitle")}</p>
        </div>

        <div className="space-y-4">
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
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-base-800/60 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">{t("cart.summary.title")}</h2>
          <p className="text-sm text-white/60">{t("cart.summary.note")}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-white/70">
          <span>{t("cart.summary.subtotal")}</span>
          <span className="text-white">{formatMoney(subtotal, "MXN")}</span>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/checkout">{t("cart.actions.checkout")}</Link>
          </Button>
          <Button type="button" variant="outline" className="border-white/10" onClick={clear}>
            {t("cart.actions.clear")}
          </Button>
          <Button asChild>
            <Link href="/catalog">{t("cart.actions.continueShopping")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
