"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PaymentMethod, Sale, Shift } from "@pos/core";
import { t } from "./i18n";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount / 100);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function parseAmount(value: string): number | null {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed * 100);
}

export default function CashRegisterPage() {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [history, setHistory] = useState<Shift[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [openingAmount, setOpeningAmount] = useState("");
  const [realAmount, setRealAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadState = useCallback(async () => {
    const api = window.api?.cashRegister;
    if (!api) {
      return;
    }
    try {
      const salesPromise = window.api?.sales.getSales() ?? Promise.resolve([]);
      const [current, shifts, salesList] = await Promise.all([
        api.getActiveShift(),
        api.getShiftHistory(),
        salesPromise
      ]);
      setActiveShift(current);
      setHistory(shifts ?? []);
      setSales(salesList ?? []);
      setError(null);
    } catch {
      setError(t("errorLoad"));
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleOpen = async () => {
    const api = window.api?.cashRegister;
    if (!api) {
      return;
    }
    const amount = parseAmount(openingAmount);
    if (amount === null) {
      setError(t("errorInvalidAmount"));
      return;
    }
    setLoading(true);
    try {
      const shift = await api.openShift(amount);
      setActiveShift(shift);
      setOpeningAmount("");
      setError(null);
      await loadState();
    } catch {
      setError(t("errorOpen"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    const api = window.api?.cashRegister;
    if (!api) {
      return;
    }
    const amount = parseAmount(realAmount);
    if (amount === null) {
      setError(t("errorInvalidAmount"));
      return;
    }
    setLoading(true);
    try {
      const shift = await api.closeShift(amount);
      setActiveShift(null);
      setRealAmount("");
      setError(null);
      setHistory((current) => [shift, ...current]);
      await loadState();
    } catch {
      setError(t("errorClose"));
    } finally {
      setLoading(false);
    }
  };

  const shiftSales = useMemo(() => {
    if (!activeShift) {
      return [];
    }
    return sales.filter((sale) => sale.shiftId === activeShift.id);
  }, [sales, activeShift]);

  const totalsByMethod = useMemo(() => {
    const totals: Record<PaymentMethod, number> = {
      EFECTIVO: 0,
      TRANSFERENCIA: 0,
      TARJETA: 0,
      CREDITO_TIENDA: 0
    };
    shiftSales.forEach((sale) => {
      totals[sale.paymentMethod] += sale.paymentAmount.amount;
    });
    return totals;
  }, [shiftSales]);

  const salesTotal = useMemo(() => {
    if (!activeShift) {
      return 0;
    }
    return shiftSales.reduce((total, sale) => total + sale.paymentAmount.amount, 0);
  }, [activeShift, shiftSales]);

  const expectedAmount = activeShift?.expectedAmount.amount ?? 0;
  const realAmountValue = parseAmount(realAmount);
  const difference = realAmountValue === null ? null : realAmountValue - expectedAmount;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-zinc-400">{t("subtitle")}</p>
      </div>

      {error ? <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {!activeShift ? (
        <section className="rounded-2xl border border-white/10 bg-base-900 p-4">
          <div className="mb-4">
            <div className="text-lg font-semibold text-white">{t("openTitle")}</div>
            <p className="text-sm text-zinc-400">{t("openDescription")}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("openAmountLabel")}
              </label>
              <input
                value={openingAmount}
                onChange={(event) => setOpeningAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleOpen();
                  }
                }}
                placeholder={t("openAmountPlaceholder")}
                className="rounded-xl border border-white/10 bg-base-900 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <button
              type="button"
              onClick={handleOpen}
              disabled={loading}
              className="h-10 rounded-xl bg-accent-500 px-6 text-sm font-semibold text-black transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-accent-500/60"
            >
              {t("openAction")}
            </button>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
            <div className="mb-4">
              <div className="text-lg font-semibold text-white">{t("activeTitle")}</div>
            </div>
            <div className="grid gap-3 text-sm text-zinc-400">
              <div className="flex items-center justify-between">
                <span>{t("openedAtLabel")}</span>
                <span className="text-white">{formatDateTime(activeShift.openedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("openingAmountLabel")}</span>
                <span className="text-white">{formatMoney(activeShift.openingAmount.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("salesTotalLabel")}</span>
                <span className="text-white">{formatMoney(salesTotal)}</span>
              </div>
              <div className="mt-2 grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>{t("cashTotalLabel")}</span>
                  <span className="text-white">{formatMoney(totalsByMethod.EFECTIVO)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("transferTotalLabel")}</span>
                  <span className="text-white">{formatMoney(totalsByMethod.TRANSFERENCIA)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("cardTotalLabel")}</span>
                  <span className="text-white">{formatMoney(totalsByMethod.TARJETA)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("storeCreditTotalLabel")}</span>
                  <span className="text-white">{formatMoney(totalsByMethod.CREDITO_TIENDA)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("expectedAmountLabel")}</span>
                <span className="text-white">{formatMoney(expectedAmount)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
            <div className="mb-4">
              <div className="text-lg font-semibold text-white">{t("closeTitle")}</div>
              <p className="text-sm text-zinc-400">{t("closeDescription")}</p>
            </div>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {t("realAmountLabel")}
                </label>
                <input
                  value={realAmount}
                  onChange={(event) => setRealAmount(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleClose();
                    }
                  }}
                  placeholder={t("realAmountPlaceholder")}
                  className="rounded-xl border border-white/10 bg-base-900 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>{t("expectedAmountLabel")}</span>
                <span className="text-white">{formatMoney(expectedAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>{t("differenceLabel")}</span>
                <span className="text-white">
                  {difference === null ? t("noValue") : formatMoney(difference)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-accent-500/60"
              >
                {t("closeAction")}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <div className="mb-3 text-lg font-semibold text-white">{t("historyTitle")}</div>
        {history.length === 0 ? (
          <div className="text-sm text-zinc-400">{t("historyEmpty")}</div>
        ) : (
          <div className="grid gap-3">
            {history.map((shift) => (
                <div key={shift.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>{formatDateTime(shift.closedAt ?? shift.openedAt)}</span>
                  <span className="text-white">{formatMoney(shift.expectedAmount.amount)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span>{t("differenceLabel")}</span>
                  <span className="text-white">
                    {shift.difference ? formatMoney(shift.difference.amount) : t("noValue")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

