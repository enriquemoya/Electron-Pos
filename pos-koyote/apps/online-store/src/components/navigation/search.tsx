"use client";

import { Search as SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

type SearchProps = {
  variant: "desktop" | "mobile";
};

export function Search({ variant }: SearchProps) {
  const t = useTranslations();
  return (
    <div className={variant === "mobile" ? "w-full" : "hidden md:block"}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          name="search"
          placeholder={t("navigation.search.placeholder")}
          className="pl-9"
        />
      </div>
    </div>
  );
}
