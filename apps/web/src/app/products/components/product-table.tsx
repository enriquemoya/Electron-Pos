"use client";

import type { InventoryAlert, Product } from "@pos/core";
import { getAvailableStock } from "@pos/core";
import type { InventoryState } from "@pos/core";
import { t } from "../i18n";

type ProductTableProps = {
  products: Product[];
  inventory: InventoryState;
  formatPrice: (amount: number) => string;
  alertsByProductId: Record<string, InventoryAlert[]>;
  onConfigureAlerts: (product: Product) => void;
};

function categoryLabel(category: Product["category"]) {
  switch (category) {
    case "TCG_SEALED":
      return t("categoryTCGSealed");
    case "TCG_SINGLE":
      return t("categoryTCGSingle");
    case "ACCESSORY":
      return t("categoryAccessory");
    case "COMMODITY":
      return t("categoryCommodity");
    case "SERVICE":
      return t("categoryService");
  }
}

export function ProductTable({
  products,
  inventory,
  formatPrice,
  alertsByProductId,
  onConfigureAlerts
}: ProductTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-base-900">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-zinc-400">
          <tr>
            <th className="px-5 py-4">{t("tableName")}</th>
            <th className="px-5 py-4">{t("tableCategory")}</th>
            <th className="px-5 py-4">{t("tablePrice")}</th>
            <th className="px-5 py-4">{t("tableStock")}</th>
            <th className="px-5 py-4">{t("tableAlerts")}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const stock = getAvailableStock(inventory, product);
            const alerts = alertsByProductId[product.id] ?? [];
            const hasOut = alerts.some((alert) => alert.type === "OUT_OF_STOCK");
            const hasLow = alerts.some((alert) => alert.type === "LOW_STOCK");
            return (
              <tr key={product.id} className="border-t border-white/5">
                <td className="px-5 py-4 font-medium text-white">
                  <div className="flex items-center gap-2">
                    <span>{product.name}</span>
                    {hasOut ? (
                      <span className="rounded-full bg-rose-500/20 px-2 py-1 text-[10px] uppercase text-rose-200">
                        {t("alertOutOfStock")}
                      </span>
                    ) : hasLow ? (
                      <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] uppercase text-amber-200">
                        {t("alertLowStock")}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4 text-zinc-300">{categoryLabel(product.category)}</td>
                <td className="px-5 py-4 text-zinc-300">
                  {formatPrice(product.price.amount)}
                </td>
                <td className="px-5 py-4 text-zinc-300">
                  {product.isStockTracked
                    ? stock ?? 0
                    : t("stockUnlimited")}
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onConfigureAlerts(product)}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white hover:border-white/30"
                  >
                    {t("alertConfigAction")}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
