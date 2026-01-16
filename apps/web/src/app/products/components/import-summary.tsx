"use client";

import type { ImportError } from "../services/excel-import";
import { t } from "../i18n";

type ImportSummaryProps = {
  created: number;
  updated: number;
  errors: ImportError[];
};

function errorMessage(code: ImportError["code"]) {
  switch (code) {
    case "MISSING_NAME":
      return t("errorMissingName");
    case "MISSING_CATEGORY":
      return t("errorMissingCategory");
    case "INVALID_CATEGORY":
      return t("errorInvalidCategory");
    case "INVALID_PRICE":
      return t("errorInvalidPrice");
    case "INVALID_STOCK_TRACKED":
      return t("errorInvalidStockTracked");
    case "INVALID_STOCK":
      return t("errorInvalidStock");
    case "PRODUCT_NOT_FOUND":
      return t("errorProductNotFound");
    default:
      return t("errorUnknown");
  }
}

export function ImportSummary({ created, updated, errors }: ImportSummaryProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-white">{t("importTitle")}</h3>
      <div className="mt-3 grid gap-3 text-sm text-zinc-300 sm:grid-cols-3">
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("importCreated")}
          </span>
          <span className="text-lg font-semibold text-white">{created}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("importUpdated")}
          </span>
          <span className="text-lg font-semibold text-white">{updated}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("importErrors")}
          </span>
          <span className="text-lg font-semibold text-white">{errors.length}</span>
        </div>
      </div>
      {errors.length > 0 ? (
        <div className="mt-4 space-y-2 text-xs text-zinc-400">
          {errors.map((error, index) => (
            <div key={`${error.row}-${index}`}>
              {t("importRowLabel")} {error.row}: {errorMessage(error.code)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
