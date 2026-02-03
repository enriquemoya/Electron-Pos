"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Chip = {
  key: string;
  label: string;
};

function buildQuery(params: Record<string, string | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function ActiveFilterChips({ className }: { className?: string }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get("query");
  const category = searchParams.get("category");
  const game = searchParams.get("game");
  const availability = searchParams.get("availability");
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");

  const availabilityLabel = availability
    ? availability === "AVAILABLE"
      ? t("availability.available")
      : availability === "LOW_STOCK"
        ? t("availability.low")
        : availability === "SOLD_OUT"
          ? t("availability.soldOut")
          : t("availability.pending")
    : null;

  const chips: Chip[] = [];
  if (query) {
    chips.push({
      key: "query",
      label: t("catalog.filters.chipQuery", { value: query })
    });
  }
  if (category) {
    chips.push({
      key: "category",
      label: t("catalog.filters.chipCategory", { value: category })
    });
  }
  if (game) {
    chips.push({
      key: "game",
      label: t("catalog.filters.chipGame", { value: game })
    });
  }
  if (availability && availabilityLabel) {
    chips.push({
      key: "availability",
      label: t("catalog.filters.chipAvailability", { value: availabilityLabel })
    });
  }
  if (priceMin || priceMax) {
    chips.push({
      key: "price",
      label: t("catalog.filters.chipPrice", {
        min: priceMin ?? "-",
        max: priceMax ?? "-"
      })
    });
  }

  if (!chips.length) return null;

  const handleClear = (key: string) => {
    const next = {
      query,
      category,
      game,
      availability,
      priceMin,
      priceMax,
      page: null,
      pageSize: searchParams.get("pageSize")
    } as Record<string, string | null>;

    if (key === "price") {
      next.priceMin = null;
      next.priceMax = null;
    } else {
      next[key] = null;
    }

    router.push(`${pathname}${buildQuery(next)}`);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <Button
          key={chip.key}
          type="button"
          variant="secondary"
          className="gap-2 rounded-full bg-white/10 text-xs text-white hover:bg-white/20"
          onClick={() => handleClear(chip.key)}
          aria-label={t("catalog.filters.chipClear", { value: chip.label })}
        >
          {chip.label}
          <X className="h-3 w-3" />
        </Button>
      ))}
    </div>
  );
}
