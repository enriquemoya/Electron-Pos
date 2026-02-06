"use client";

import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

type SearchProps = {
  variant: "desktop" | "mobile";
};

export function Search({ variant }: SearchProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (variant === "mobile") {
    return (
      <div className="w-full">
        <div className="relative">
          {mounted ? (
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          ) : null}
          <Input name="search" placeholder={t("navigation.search.placeholder")} className="pl-9" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative hidden md:flex">
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white/70 transition hover:text-white"
        aria-label={t("navigation.search.open")}
        onClick={() => setOpen(true)}
      >
        {mounted ? <SearchIcon className="h-4 w-4" /> : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 border-b border-white/10 bg-base-900/95 backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-4 sm:px-4">
              <div className="relative flex-1">
                {mounted ? (
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                ) : null}
                <Input
                  ref={inputRef}
                  name="search"
                  placeholder={t("navigation.search.placeholder")}
                  className="pl-9 pr-10"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white/70 transition hover:text-white"
                aria-label={t("navigation.search.close")}
                onClick={() => setOpen(false)}
              >
                {mounted ? <X className="h-4 w-4" /> : null}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
