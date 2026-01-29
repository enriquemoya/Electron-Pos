"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 5000;

const categoryOptions = [
  "Boosters",
  "Decks",
  "Accessories",
  "Singles",
  "Bundles"
];

const gameOptions = ["pokemon", "one piece", "yugioh", "other"];

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

type ComboboxProps = {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  emptyLabel: string;
  onChange: (value: string) => void;
};

function Combobox({ label, placeholder, value, options, emptyLabel, onChange }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between">
            <span className={value ? "text-white" : "text-white/50"}>
              {value || placeholder}
            </span>
            <ChevronDown className="h-4 w-4 text-white/60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <Command>
            <CommandInput
              placeholder={placeholder}
              value={value}
              onValueChange={(next) => onChange(next)}
            />
            <CommandList>
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={(selected) => {
                      onChange(selected);
                      setOpen(false);
                    }}
                  >
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CatalogFilters({ className }: CatalogFiltersProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

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
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setAvailability("");
    setGameTypeId("");
    setRange([DEFAULT_MIN, DEFAULT_MAX]);
    router.push(pathname);
  };

  const filterContent = (
    <div className="grid gap-3">
      <Input
        name="query"
        placeholder={t("catalog.searchPlaceholder")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Combobox
        label={t("catalog.filters.category")}
        placeholder={t("catalog.categoryPlaceholder")}
        value={category}
        options={categoryOptions}
        emptyLabel={t("catalog.filters.empty")}
        onChange={setCategory}
      />
      <Combobox
        label={t("catalog.filters.game")}
        placeholder={t("catalog.filters.game")}
        value={gameTypeId}
        options={gameOptions}
        emptyLabel={t("catalog.filters.empty")}
        onChange={setGameTypeId}
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
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              {t("catalog.filters.title")}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t("catalog.filters.title")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {filterContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">{t("catalog.filters.title")}</div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsDesktopOpen((value) => !value)}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", isDesktopOpen ? "rotate-180" : "")}
            />
          </Button>
        </div>
        {isDesktopOpen ? <div className="mt-4">{filterContent}</div> : null}
      </div>
    </div>
  );
}
