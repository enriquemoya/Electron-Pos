"use client";

import { useEffect, useRef } from "react";
import { t } from "../i18n";

type ProductSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmitFirst: () => void;
  onFocus: () => void;
};

export function ProductSearch({ value, onChange, onSubmitFirst, onFocus }: ProductSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {t("productListTitle")}
      </label>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmitFirst();
          }
        }}
        onFocus={onFocus}
        placeholder={t("searchPlaceholder")}
        className="rounded-xl border border-white/10 bg-base-900 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
      />
    </div>
  );
}
