import { t } from "../i18n";

type CartSummaryProps = {
  total: string;
};

export function CartSummary({ total }: CartSummaryProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>{t("totalLabel")}</span>
        <span className="text-lg font-semibold text-white">{total}</span>
      </div>
    </div>
  );
}
