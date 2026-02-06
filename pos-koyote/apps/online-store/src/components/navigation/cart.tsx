"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type CartProps = {
  badgeCount?: number;
};

export function Cart({ badgeCount }: CartProps) {
  const t = useTranslations();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="relative gap-2"
      aria-label={t("navigation.cart.label")}
    >
      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{t("navigation.cart.label")}</span>
      {badgeCount ? (
        <span className="ml-2 rounded-full bg-accent-500 px-2 text-xs text-white">
          {badgeCount}
        </span>
      ) : null}
    </Button>
  );
}
