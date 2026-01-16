import type { SaleItem } from "@pos/core";
import { t } from "../i18n";

type CartItemProps = {
  item: SaleItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  formatMoney: (amount: number) => string;
};

export function CartItem({ item, onIncrease, onDecrease, onRemove, formatMoney }: CartItemProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-base-900 px-4 py-4">
      <div className="flex flex-1 flex-col gap-2">
        <span className="text-sm font-semibold text-white">{item.name}</span>
        <span className="text-xs text-zinc-400">
          {formatMoney(item.unitPrice.amount)} x {item.quantity}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrease}
          className="h-10 w-10 rounded-xl border border-white/10 bg-white/10 text-lg font-semibold text-white"
        >
          {t("decreaseAction")}
        </button>
        <span className="text-sm font-semibold text-white">{item.quantity}</span>
        <button
          type="button"
          onClick={onIncrease}
          className="h-10 w-10 rounded-xl border border-white/10 bg-white/10 text-lg font-semibold text-white"
        >
          {t("increaseAction")}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300"
        >
          {t("removeAction")}
        </button>
      </div>
    </div>
  );
}
