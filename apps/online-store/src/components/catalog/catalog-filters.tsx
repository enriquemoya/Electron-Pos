"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, ChevronsUpDown, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 5000;

type FilterItem = { href: string; label: string; active?: boolean };

type FilterSection = {
  title: string;
  items: FilterItem[];
  clearHref?: string;
  clearLabel?: string;
};

type CatalogFiltersProps = {
  className?: string;
  sections: FilterSection[];
  baseCatalogPath?: string;
};

type TaxonomyFilterComboboxProps = {
  title: string;
  options: FilterItem[];
  value: string;
  emptyLabel: string;
  noOptionsLabel: string;
  clearHref?: string;
  clearLabel?: string;
  onSelect: (href: string) => void;
};

function TaxonomyFilterCombobox({
  title,
  options,
  value,
  emptyLabel,
  noOptionsLabel,
  clearHref,
  clearLabel,
  onSelect
}: TaxonomyFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.href === value)?.label ?? emptyLabel;

  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wide text-white/60">{title}</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">{selectedLabel}</span>
            <ChevronsUpDown className="h-4 w-4 text-white/60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder={title} />
            <CommandList>
              <CommandEmpty>{noOptionsLabel}</CommandEmpty>
              <CommandGroup>
                {clearHref ? (
                  <CommandItem
                    value={`clear-${title}`}
                    onSelect={() => {
                      onSelect(clearHref);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                    {clearLabel || emptyLabel}
                  </CommandItem>
                ) : null}
                {options.map((option) => (
                  <CommandItem
                    key={`${title}-${option.href}`}
                    value={option.label}
                    onSelect={() => {
                      onSelect(option.href);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.href ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
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

export function CatalogFilters({
  className,
  sections,
  baseCatalogPath = "/catalog"
}: CatalogFiltersProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  const initial = useMemo(() => {
    return {
      pageSize: searchParams.get("pageSize") ?? "",
      priceMin: parseParam(searchParams.get("priceMin")),
      priceMax: parseParam(searchParams.get("priceMax"))
    };
  }, [searchParams]);

  const [range, setRange] = useState<[number, number]>([
    initial.priceMin ?? DEFAULT_MIN,
    initial.priceMax ?? DEFAULT_MAX
  ]);

  useEffect(() => {
    setRange([
      initial.priceMin ?? DEFAULT_MIN,
      initial.priceMax ?? DEFAULT_MAX
    ]);
  }, [initial]);

  const applyFilters = () => {
    const queryString = buildQuery({
      pageSize: initial.pageSize || null,
      priceMin: range[0] !== DEFAULT_MIN ? String(range[0]) : null,
      priceMax: range[1] !== DEFAULT_MAX ? String(range[1]) : null,
      page: null
    });

    router.push(`${pathname}${queryString}`);
  };

  const navigateToTaxonomy = (href: string) => {
    const queryString = buildQuery({
      pageSize: initial.pageSize || null,
      priceMin: initial.priceMin !== null ? String(initial.priceMin) : null,
      priceMax: initial.priceMax !== null ? String(initial.priceMax) : null,
      page: null
    });
    router.push(`${href}${queryString}`);
  };

  const clearFilters = () => {
    setRange([DEFAULT_MIN, DEFAULT_MAX]);
    const queryString = buildQuery({
      pageSize: initial.pageSize || null,
      page: null
    });
    router.push(`${baseCatalogPath}${queryString}`);
  };

  const taxonomyContent = (
    <div className="grid gap-4">
      {sections
        .filter((section) => section.items.length > 0)
        .map((section) => (
          <TaxonomyFilterCombobox
            key={section.title}
            title={section.title}
            options={section.items}
            value={section.items.find((item) => item.active)?.href ?? ""}
            emptyLabel={section.clearLabel ?? section.title}
            noOptionsLabel={t("catalog.filters.noOptions")}
            clearHref={section.clearHref}
            clearLabel={section.clearLabel}
            onSelect={navigateToTaxonomy}
          />
        ))}
    </div>
  );

  const priceContent = (
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
  );

  const filterContent = (
    <div className="grid gap-4">
      {taxonomyContent}
      {priceContent}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={applyFilters}>
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
            <div className="mt-6 space-y-4">{filterContent}</div>
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
