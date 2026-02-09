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

  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");

  const chips: Chip[] = [];
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
      priceMin,
      priceMax,
      page: null,
      pageSize: searchParams.get("pageSize")
    } as Record<string, string | null>;

    if (key === "price") {
      next.priceMin = null;
      next.priceMax = null;
    }

    router.push(`${pathname}${buildQuery(next)}`);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <Button
          key={chip.key}
          type="button"
          variant="ghost"
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
