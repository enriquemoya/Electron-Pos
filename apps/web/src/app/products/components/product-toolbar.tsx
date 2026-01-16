"use client";

import { useRef } from "react";
import type { ProductCategory } from "@pos/core";
import { t } from "../i18n";

type ProductToolbarProps = {
  search: string;
  category: ProductCategory | "ALL";
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: ProductCategory | "ALL") => void;
  onAddProduct: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
};

export function ProductToolbar({
  search,
  category,
  onSearchChange,
  onCategoryChange,
  onAddProduct,
  onExport,
  onImport
}: ProductToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Forward the file to the import flow and reset the input for repeat uploads.
      onImport(file);
      event.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-white/10 bg-base-900 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("filterLabel")}
          </label>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as ProductCategory | "ALL")}
            className="rounded-xl border border-white/10 bg-base-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="ALL">{t("filterAll")}</option>
            <option value="TCG_SEALED">{t("categoryTCGSealed")}</option>
            <option value="TCG_SINGLE">{t("categoryTCGSingle")}</option>
            <option value="ACCESSORY">{t("categoryAccessory")}</option>
            <option value="COMMODITY">{t("categoryCommodity")}</option>
            <option value="SERVICE">{t("categoryService")}</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAddProduct}
          className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-accent-600"
        >
          {t("addProduct")}
        </button>
        <button
          type="button"
          onClick={onExport}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          {t("exportExcel")}
        </button>
        <button
          type="button"
          onClick={handleFileClick}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          {t("importExcel")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
