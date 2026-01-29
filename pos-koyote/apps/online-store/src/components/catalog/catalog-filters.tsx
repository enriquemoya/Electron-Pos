"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 5000;

function parseParam(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildQuery(params: Record<string, string | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

type CatalogFiltersProps = {
  className?: string;
};

export function CatalogFilters({ className }: CatalogFiltersProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const initial = useMemo(() => {
    return {
      query: searchParams.get("query") ?? "",
      category: searchParams.get("category") ?? "",
      availability: searchParams.get("availability") ?? "",
      gameTypeId: searchParams.get("gameTypeId") ?? "",
      pageSize: searchParams.get("pageSize") ?? "",
      priceMin: parseParam(searchParams.get("priceMin")),
      priceMax: parseParam(searchParams.get("priceMax"))
    };
  }, [searchParams]);

  const [query, setQuery] = useState(initial.query);
  const [category, setCategory] = useState(initial.category);
  const [availability, setAvailability] = useState(initial.availability);
  const [gameTypeId, setGameTypeId] = useState(initial.gameTypeId);
  const [range, setRange] = useState<[number, number]>([
    initial.priceMin ?? DEFAULT_MIN,
    initial.priceMax ?? DEFAULT_MAX
  ]);

  useEffect(() => {
    setQuery(initial.query);
    setCategory(initial.category);
    setAvailability(initial.availability);
    setGameTypeId(initial.gameTypeId);
    setRange([
      initial.priceMin ?? DEFAULT_MIN,
      initial.priceMax ?? DEFAULT_MAX
    ]);
  }, [initial]);

  const applyFilters = (next?: Partial<typeof initial>) => {
    const merged = {
      query,
      category,
      availability,
      gameTypeId,
      priceMin: range[0] !== DEFAULT_MIN ? range[0] : null,
      priceMax: range[1] !== DEFAULT_MAX ? range[1] : null,
      ...next
    };

    const queryString = buildQuery({
      query: merged.query || null,
      category: merged.category || null,
      availability: merged.availability || null,
      gameTypeId: merged.gameTypeId || null,
      pageSize: initial.pageSize || null,
      priceMin: merged.priceMin !== null ? String(merged.priceMin) : null,
      priceMax: merged.priceMax !== null ? String(merged.priceMax) : null,
      page: null
    });

    router.push(`${pathname}${queryString}`);
    setIsMobileOpen(false);
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setAvailability("");
    setGameTypeId("");
    setRange([DEFAULT_MIN, DEFAULT_MAX]);
    router.push(pathname);
    setIsMobileOpen(false);
  };

  const filterContent = (
    <div className="grid gap-3">
      <Input
        name="query"
        placeholder={t("catalog.searchPlaceholder")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Input
        name="category"
        placeholder={t("catalog.categoryPlaceholder")}
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      />
      <Input
        name="gameTypeId"
        placeholder={t("catalog.filters.game")}
        value={gameTypeId}
        onChange={(event) => setGameTypeId(event.target.value)}
      />
      <select
        name="availability"
        value={availability}
        onChange={(event) => setAvailability(event.target.value)}
        className="h-10 w-full rounded-md border border-white/10 bg-base-900 px-3 text-sm text-white/80"
      >
        <option value="">{t("catalog.availabilityPlaceholder")}</option>
        <option value="AVAILABLE">{t("availability.available")}</option>
        <option value="LOW_STOCK">{t("availability.low")}</option>
        <option value="SOLD_OUT">{t("availability.soldOut")}</option>
        <option value="PENDING_SYNC">{t("availability.pending")}</option>
      </select>
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-white/60">
          {t("catalog.filters.price")}
        </div>
        <Slider
          min={DEFAULT_MIN}
          max={DEFAULT_MAX}
          step={10}
          value={range}
          onValueChange={(value) => setRange([value[0], value[1]])}
          onValueCommit={() => applyFilters()}
          aria-label={t("catalog.filters.price")}
          thumbLabels={[
            t("catalog.filters.priceMin", { value: range[0] }),
            t("catalog.filters.priceMax", { value: range[1] })
          ]}
        />
        <div className="flex justify-between text-xs text-white/60">
          <span>{t("catalog.filters.priceMin", { value: range[0] })}</span>
          <span>{t("catalog.filters.priceMax", { value: range[1] })}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => applyFilters()}>
          {t("catalog.applyFilters")}
        </Button>
        <Button type="button" variant="ghost" onClick={clearFilters}>
          {t("catalog.filters.clear")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn("rounded-xl border border-white/10 bg-base-800/60 p-4", className)}>
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div className="text-sm font-semibold text-white">{t("catalog.filters.title")}</div>
        <Button type="button" variant="outline" onClick={() => setIsMobileOpen(true)}>
          {t("catalog.filters.title")}
        </Button>
      </div>

      <div className="hidden md:block">{filterContent}</div>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden" onClick={() => setIsMobileOpen(false)}>
          <div
            className="h-full w-full max-w-sm bg-base-950 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{t("catalog.filters.title")}</h2>
              <Button type="button" variant="ghost" onClick={() => setIsMobileOpen(false)}>
                {t("navigation.mobile.close")}
              </Button>
            </div>
            <div className="mt-4">{filterContent}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
