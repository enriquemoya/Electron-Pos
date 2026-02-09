"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SortOption = { value: string; label: string };

type Props = {
  basePath: string;
  page: number;
  pageSize: number;
  hasMore: boolean;
  query: string;
  sort?: string;
  direction?: "asc" | "desc";
  sortOptions?: SortOption[];
  labels: {
    search: string;
    prev: string;
    next: string;
    pageSize: string;
    sort: string;
  };
};

export function AdminTableControls({
  basePath,
  page,
  pageSize,
  hasMore,
  query,
  sort,
  direction,
  sortOptions,
  labels
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (searchValue) {
        params.set("query", searchValue);
        params.set("page", "1");
      } else {
        params.delete("query");
        params.set("page", "1");
      }
      router.replace(`${basePath}?${params.toString()}`);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchValue, router, basePath, searchParams]);

  const pageParams = useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    return params;
  }, [searchParams]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(pageParams.toString());
    params.set(key, value);
    if (key !== "page") {
      params.set("page", "1");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(pageParams.toString());
    params.set("page", String(nextPage));
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={labels.search}
          className="h-9 w-56"
        />
        {sortOptions && sortOptions.length > 0 ? (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span>{labels.sort}</span>
            <select
              className="h-9 rounded-md border border-white/10 bg-transparent px-2 text-sm text-white"
              value={sort ?? sortOptions[0].value}
              onChange={(event) => updateParam("sort", event.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-white/10 bg-transparent px-2 text-sm text-white"
              value={direction ?? "desc"}
              onChange={(event) => updateParam("direction", event.target.value)}
            >
              <option value="desc">DESC</option>
              <option value="asc">ASC</option>
            </select>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
        <span>{labels.pageSize}</span>
        <select
          className="h-9 rounded-md border border-white/10 bg-transparent px-2 text-sm text-white"
          value={pageSize}
          onChange={(event) => updateParam("pageSize", event.target.value)}
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={() => goToPage(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          {labels.prev}
        </Button>
        <Button size="sm" variant="outline" onClick={() => goToPage(page + 1)} disabled={!hasMore}>
          {labels.next}
        </Button>
      </div>
    </div>
  );
}
