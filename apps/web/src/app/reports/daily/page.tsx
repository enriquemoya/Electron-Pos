"use client";

import { useEffect, useMemo, useState } from "react";
import type { PaymentMethod, Sale, Shift } from "@pos/core";
import { t } from "./i18n";

type DailySummary = {
  date: string;
  totalAmount: number;
  salesCount: number;
  byMethod: Record<PaymentMethod, number>;
  pendingProofs: number;
  credit: { granted: number; used: number };
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function paymentLabel(method: PaymentMethod) {
  switch (method) {
    case "EFECTIVO":
      return t("methodCash");
    case "TRANSFERENCIA":
      return t("methodTransfer");
    case "TARJETA":
      return t("methodCard");
    case "CREDITO_TIENDA":
      return t("methodStoreCredit");
    default:
      return method;
  }
}

export default function DailyReportsPage() {
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const api = window.api?.dailyReports;
      if (!api) {
        return;
      }
      setLoading(true);
      try {
        const [summaryResult, salesResult, shiftResult] = await Promise.all([
          api.getDailySummary(date),
          api.getDailySales(date),
          api.getDailyShifts(date)
        ]);
        setSummary(summaryResult);
        setSales(salesResult ?? []);
        setShifts(shiftResult ?? []);
        setError(null);
      } catch {
        setError(t("errorLoad"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date]);

  const hasDifferences = useMemo(() => {
    return shifts.some((shift) => shift.difference && shift.difference.amount !== 0);
  }, [shifts]);

  const handleGeneratePdf = async () => {
    const api = window.api?.dailyReports;
    if (!api) {
      return;
    }
    setPdfLoading(true);
    try {
      const filepath = await api.generateDailyReportPDF(date);
      setPdfPath(filepath);
      setError(null);
    } catch {
      setError(t("errorPdf"));
    } finally {
      setPdfLoading(false);
    }
  };

  const handleOpenPdf = async () => {
    const api = window.api?.dailyReports;
    if (!api || !pdfPath) {
      return;
    }
    await api.openReportPDF(pdfPath);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-zinc-400">{t("subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("dateLabel")}</label>
        <input
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setPdfPath(null);
          }}
          className="mt-2 rounded-xl border border-white/10 bg-base-900 px-4 py-2 text-sm text-white"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-zinc-400">{t("loading")}</div>
      ) : summary ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("totalSales")}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatMoney(summary.totalAmount)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("salesCount")}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{summary.salesCount}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("pendingProofs")}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{summary.pendingProofs}</div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-base-900 p-4">
            <div className="mb-3 text-sm font-semibold text-white">{t("paymentBreakdown")}</div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-base-950/40 p-3 text-sm text-white">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("methodCash")}</div>
                <div className="mt-2">{formatMoney(summary.byMethod.EFECTIVO)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-base-950/40 p-3 text-sm text-white">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("methodTransfer")}</div>
                <div className="mt-2">{formatMoney(summary.byMethod.TRANSFERENCIA)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-base-950/40 p-3 text-sm text-white">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("methodCard")}</div>
                <div className="mt-2">{formatMoney(summary.byMethod.TARJETA)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-base-950/40 p-3 text-sm text-white">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("methodStoreCredit")}</div>
                <div className="mt-2">{formatMoney(summary.byMethod.CREDITO_TIENDA)}</div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-base-900 p-4">
            <div className="mb-3 text-sm font-semibold text-white">{t("creditSummary")}</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-base-950/40 p-3 text-sm text-white">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("creditGranted")}</div>
                <div className="mt-2">{formatMoney(summary.credit.granted)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-base-950/40 p-3 text-sm text-white">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("creditUsed")}</div>
                <div className="mt-2">{formatMoney(summary.credit.used)}</div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-base-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-white">{t("shiftsTitle")}</div>
              {hasDifferences ? (
                <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
                  {t("warningDifference")}
                </span>
              ) : null}
            </div>
            {shifts.length === 0 ? (
              <div className="text-sm text-zinc-400">{t("emptyShifts")}</div>
            ) : (
              <div className="overflow-x-auto text-sm text-zinc-200">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    <tr>
                      <th className="py-2">{t("shiftId")}</th>
                      <th className="py-2">{t("shiftOpened")}</th>
                      <th className="py-2">{t("shiftClosed")}</th>
                      <th className="py-2">{t("shiftOpeningAmount")}</th>
                      <th className="py-2">{t("shiftExpected")}</th>
                      <th className="py-2">{t("shiftReal")}</th>
                      <th className="py-2">{t("shiftDifference")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift) => (
                      <tr key={shift.id} className="border-t border-white/10">
                        <td className="py-2">{shift.id}</td>
                        <td className="py-2">{formatDate(shift.openedAt)}</td>
                        <td className="py-2">{shift.closedAt ? formatDate(shift.closedAt) : "-"}</td>
                        <td className="py-2">{formatMoney(shift.openingAmount.amount)}</td>
                        <td className="py-2">{formatMoney(shift.expectedAmount.amount)}</td>
                        <td className="py-2">
                          {shift.realAmount ? formatMoney(shift.realAmount.amount) : "-"}
                        </td>
                        <td className="py-2">
                          {shift.difference ? formatMoney(shift.difference.amount) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-base-900 p-4">
            <div className="mb-3 text-sm font-semibold text-white">{t("salesListTitle")}</div>
            {sales.length === 0 ? (
              <div className="text-sm text-zinc-400">{t("emptySales")}</div>
            ) : (
              <div className="overflow-x-auto text-sm text-zinc-200">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    <tr>
                      <th className="py-2">{t("salesTicket")}</th>
                      <th className="py-2">{t("salesTime")}</th>
                      <th className="py-2">{t("salesTotal")}</th>
                      <th className="py-2">{t("salesMethod")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id} className="border-t border-white/10">
                        <td className="py-2">{sale.id}</td>
                        <td className="py-2">{formatDate(sale.createdAt)}</td>
                        <td className="py-2">{formatMoney(sale.total.amount)}</td>
                        <td className="py-2">{paymentLabel(sale.paymentMethod)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={pdfLoading}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                pdfLoading ? "cursor-not-allowed bg-white/10 text-zinc-500" : "bg-accent-500 text-black"
              }`}
            >
              {t("generatePdf")}
            </button>
            <button
              type="button"
              onClick={handleOpenPdf}
              disabled={!pdfPath}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                pdfPath ? "border-white/10 text-white hover:border-white/30" : "border-white/5 text-zinc-600"
              }`}
            >
              {t("openPdf")}
            </button>
            {pdfPath ? (
              <span className="text-xs text-zinc-500">{pdfPath}</span>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}

