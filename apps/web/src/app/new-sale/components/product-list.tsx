import type { InventoryState, Product } from "@pos/core";
import { getAvailableStock } from "@pos/core";
import { t } from "../i18n";

type ProductListProps = {
  products: Product[];
  inventory: InventoryState;
  onSelect: (product: Product) => void;
  formatMoney: (amount: number) => string;
};

export function ProductList({ products, inventory, onSelect, formatMoney }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-base-900 p-4 text-sm text-zinc-400">
        {t("searchNoResults")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {products.map((product) => {
        const stock = getAvailableStock(inventory, product);
        const stockValue = product.isStockTracked
          ? stock ?? 0
          : t("stockUnlimited");
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-base-900 px-4 py-4 text-left transition hover:bg-white/5"
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">{product.name}</span>
              <span className="text-xs text-zinc-400">
                {t("stockLabel")}: {stockValue}
              </span>
            </div>
            <span className="text-sm font-semibold text-white">{formatMoney(product.price.amount)}</span>
          </button>
        );
      })}
    </div>
  );
}
