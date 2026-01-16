import { t } from "../i18n";
import type { Customer, PaymentMethod } from "@pos/core";

type PaymentPanelProps = {
  method: PaymentMethod | null;
  reference: string;
  proofFile: File | null;
  customerQuery: string;
  customerResults: Customer[];
  selectedCustomer: Customer | null;
  customerBalance: number | null;
  onMethodChange: (value: PaymentMethod | null) => void;
  onReferenceChange: (value: string) => void;
  onProofChange: (file: File | null) => void;
  onCustomerQueryChange: (value: string) => void;
  onCustomerSelect: (customerId: string | null) => void;
  formatMoney: (amount: number) => string;
};

const proofRequiredMethods: PaymentMethod[] = ["TRANSFERENCIA", "TARJETA"];

export function PaymentPanel({
  method,
  reference,
  proofFile,
  customerQuery,
  customerResults,
  selectedCustomer,
  customerBalance,
  onMethodChange,
  onReferenceChange,
  onProofChange,
  onCustomerQueryChange,
  onCustomerSelect,
  formatMoney
}: PaymentPanelProps) {
  const proofRequired = method ? proofRequiredMethods.includes(method) : false;
  const storeCreditSelected = method === "CREDITO_TIENDA";
  const hasMinQuery = customerQuery.trim().length >= 5;

  return (
    <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
      <div className="mb-3 text-sm font-semibold text-white">{t("paymentTitle")}</div>
      <div className="grid gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("paymentTitle")}
          </label>
          <select
            value={method ?? ""}
            onChange={(event) => onMethodChange(event.target.value as PaymentMethod)}
            className="rounded-xl border border-white/10 bg-base-900 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="EFECTIVO">{t("paymentMethodCash")}</option>
            <option value="TRANSFERENCIA">{t("paymentMethodTransfer")}</option>
            <option value="TARJETA">{t("paymentMethodCard")}</option>
            <option value="CREDITO_TIENDA">{t("paymentMethodStoreCredit")}</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("paymentReferenceLabel")}
          </label>
          <input
            value={reference}
            onChange={(event) => onReferenceChange(event.target.value)}
            placeholder={t("paymentReferencePlaceholder")}
            className="rounded-xl border border-white/10 bg-base-900 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
        {storeCreditSelected ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-base-950/40 p-3">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("storeCreditCustomerLabel")}
            </div>
            <input
              value={customerQuery}
              onChange={(event) => onCustomerQueryChange(event.target.value)}
              placeholder={t("storeCreditSearchPlaceholder")}
              className="rounded-xl border border-white/10 bg-base-900 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            {!hasMinQuery ? (
              <span className="text-xs text-zinc-500">{t("storeCreditMinChars")}</span>
            ) : null}
            <div className="flex flex-col gap-2">
              {!hasMinQuery ? null : customerResults.length === 0 ? (
                <span className="text-xs text-zinc-500">{t("storeCreditNoResults")}</span>
              ) : (
                customerResults.map((customer) => {
                  const fullName = `${customer.firstNames} ${customer.lastNamePaternal} ${customer.lastNameMaternal}`.trim();
                  const contact = customer.phone ?? customer.email ?? "";
                  const active = selectedCustomer?.id === customer.id;
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => onCustomerSelect(customer.id)}
                      className={`flex flex-col gap-1 rounded-xl border px-3 py-2 text-left text-sm transition ${
                        active
                          ? "border-accent-500 bg-accent-500/10 text-white"
                          : "border-white/10 bg-base-900 text-zinc-300 hover:border-white/30"
                      }`}
                    >
                      <span className="font-semibold">{fullName}</span>
                      <span className="text-xs text-zinc-400">{contact}</span>
                    </button>
                  );
                })
              )}
            </div>
            {selectedCustomer ? (
              <div className="rounded-xl border border-white/10 bg-base-900 px-3 py-2 text-sm text-white">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {t("storeCreditSelectedLabel")}
                </div>
                <div className="mt-2 font-semibold">
                  {`${selectedCustomer.firstNames} ${selectedCustomer.lastNamePaternal} ${selectedCustomer.lastNameMaternal}`.trim()}
                </div>
                <div className="text-xs text-zinc-400">
                  {selectedCustomer.phone ?? selectedCustomer.email ?? t("storeCreditContactEmpty")}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                  <span>{t("storeCreditBalanceLabel")}</span>
                  <span className="text-white">
                    {customerBalance !== null ? formatMoney(customerBalance) : t("storeCreditBalanceEmpty")}
                  </span>
                </div>
              </div>
            ) : null}
            {selectedCustomer ? (
              <button
                type="button"
                onClick={() => onCustomerSelect(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                {t("storeCreditClearSelection")}
              </button>
            ) : null}
          </div>
        ) : null}
        {proofRequired ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("paymentProofLabel")}
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                onProofChange(file);
                event.target.value = "";
              }}
              className="rounded-xl border border-white/10 bg-base-900 px-4 py-2 text-sm text-white"
            />
            <span className="text-xs text-zinc-500">{t("paymentProofHint")}</span>
            {proofFile ? (
              <span className="text-xs text-zinc-400">
                {t("paymentProofSelected")}: {proofFile.name}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
