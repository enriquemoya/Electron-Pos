import { t } from "../i18n";

type SaleActionsProps = {
  onConfirm: () => void;
  onClear: () => void;
  error: string | null;
  confirmDisabled: boolean;
  confirmDisabledReason: string | null;
};

export function SaleActions({
  onConfirm,
  onClear,
  error,
  confirmDisabled,
  confirmDisabledReason
}: SaleActionsProps) {
  const helper = error ?? confirmDisabledReason;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-base-900 p-4">
      {helper ? <div className="text-sm text-red-400">{helper}</div> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            confirmDisabled
              ? "cursor-not-allowed bg-white/10 text-zinc-500"
              : "bg-accent-500 text-black hover:bg-accent-600"
          }`}
        >
          {t("confirmAction")}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white"
        >
          {t("clearSaleAction")}
        </button>
      </div>
    </div>
  );
}
