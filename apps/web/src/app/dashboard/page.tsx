"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PaymentMethod } from "@pos/core";
import { t } from "./i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

type DashboardSummary = {
  dailyStatus: {
    date: string;
    shiftStatus: "OPEN" | "CLOSED";
    openedAt: string | null;
    salesTotal: number;
    salesCount: number;
  };
  salesSummary: {
    total: number;
    byMethod: Record<PaymentMethod, number>;
    averageTicket: number;
  };
  alerts: {
    outOfStock: {
      id: string;
      productId: string;
      productName: string;
      currentStock: number;
      threshold: number;
      createdAt: string;
    }[];
    lowStock: {
      id: string;
      productId: string;
      productName: string;
      currentStock: number;
      threshold: number;
      createdAt: string;
    }[];
    pendingProofs: { id: string; totalAmount: number; createdAt: string }[];
    tournamentsWithoutWinners: { id: string; name: string; date: string; updatedAt: string }[];
  };
  recentActivity: {
    type: "SALE" | "CUSTOMER" | "TOURNAMENT";
    id: string;
    label: string;
    amount?: number;
    createdAt: string;
  }[];
};

declare global {
  interface Window {
    api?: {
      dashboard: {
        getSummary: (date: string) => Promise<DashboardSummary>;
      };
    };
  }
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    amount / 100
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "full" }).format(localDate);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function methodLabel(method: PaymentMethod) {
  switch (method) {
    case "EFECTIVO":
      return t("paymentCash");
    case "TRANSFERENCIA":
      return t("paymentTransfer");
    case "TARJETA":
      return t("paymentCard");
    case "CREDITO_TIENDA":
      return t("paymentStoreCredit");
    default:
      return method;
  }
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toLocaleDateString("en-CA"), []);

  useEffect(() => {
    const api = window.api;
    if (!api) {
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.dashboard.getSummary(today);
        setSummary(response);
        setError(null);
      } catch {
        setError(t("errorLoad"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [today]);

  const dailyStatus = summary?.dailyStatus;
  const salesSummary = summary?.salesSummary;
  const alerts = summary?.alerts;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-zinc-400">
          {dailyStatus ? formatDate(dailyStatus.date) : t("subtitle")}
        </p>
      </header>

      {loading ? <div className="text-sm text-zinc-400">{t("loading")}</div> : null}
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="flex h-56 flex-col rounded-2xl border border-white/10 bg-base-900">
          <CardHeader>
            <CardDescription>{t("cardDateLabel")}</CardDescription>
            <CardTitle className="text-lg text-white">
              {dailyStatus ? formatDate(dailyStatus.date) : t("emptyValue")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="flex h-56 flex-col rounded-2xl border border-white/10 bg-base-900">
          <CardHeader>
            <CardDescription>{t("cardShiftLabel")}</CardDescription>
            <CardTitle className="text-lg text-white">
              {dailyStatus
                ? dailyStatus.shiftStatus === "OPEN"
                  ? t("shiftOpen")
                  : t("shiftClosed")
                : t("emptyValue")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400">
            {dailyStatus?.openedAt ? formatDateTime(dailyStatus.openedAt) : t("shiftNoOpen")}
          </CardContent>
        </Card>
        <Card className="flex h-56 flex-col rounded-2xl border border-white/10 bg-base-900">
          <CardHeader>
            <CardDescription>{t("cardSalesCountLabel")}</CardDescription>
            <CardTitle className="text-lg text-white">
              {dailyStatus ? dailyStatus.salesCount : 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="flex h-56 flex-col rounded-2xl border border-white/10 bg-base-900">
          <CardHeader>
            <CardDescription>{t("cardSalesTotalLabel")}</CardDescription>
            <CardTitle className="text-lg text-white">
              {dailyStatus ? formatMoney(dailyStatus.salesTotal) : formatMoney(0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="flex h-56 flex-col rounded-2xl border border-white/10 bg-base-900 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-white">{t("salesSummaryTitle")}</CardTitle>
            <CardDescription>{t("salesSummarySubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="no-scrollbar grid flex-1 gap-3 overflow-y-auto">
            <div className="flex items-center justify-between text-sm text-zinc-200">
              <span>{t("salesSummaryTotal")}</span>
              <span className="font-semibold text-white">
                {salesSummary ? formatMoney(salesSummary.total) : formatMoney(0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-200">
              <span>{t("salesSummaryAverage")}</span>
              <span className="font-semibold text-white">
                {salesSummary ? formatMoney(salesSummary.averageTicket) : formatMoney(0)}
              </span>
            </div>
            <div className="grid gap-2 text-sm text-zinc-200 md:grid-cols-2">
              {salesSummary
                ? (Object.keys(salesSummary.byMethod) as PaymentMethod[]).map((method) => (
                    <div key={method} className="flex items-center justify-between">
                      <span>{methodLabel(method)}</span>
                      <span className="font-semibold text-white">
                        {formatMoney(salesSummary.byMethod[method])}
                      </span>
                    </div>
                  ))
                : null}
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-56 flex-col rounded-2xl border border-white/10 bg-base-900">
          <CardHeader>
            <CardTitle className="text-lg text-white">{t("alertsTitle")}</CardTitle>
            <CardDescription>{t("alertsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="no-scrollbar flex-1 space-y-3 overflow-y-auto text-sm text-zinc-200">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("alertOutOfStock")}
              </div>
            {alerts?.outOfStock?.length ? (
              alerts.outOfStock.map((item) => (
                  <Link
                    key={item.id}
                    href="/inventory"
                    className="mt-2 block rounded-lg border border-white/10 bg-base-950/40 px-3 py-2 text-xs text-white"
                  >
                    {item.productName} · {t("alertStockValue", { value: item.currentStock })}
                  </Link>
                ))
              ) : (
                <div className="mt-2 text-xs text-zinc-500">{t("alertEmpty")}</div>
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("alertLowStock")}
              </div>
            {alerts?.lowStock?.length ? (
              alerts.lowStock.map((item) => (
                  <Link
                    key={item.id}
                    href="/inventory"
                    className="mt-2 block rounded-lg border border-white/10 bg-base-950/40 px-3 py-2 text-xs text-white"
                  >
                    {item.productName} · {t("alertStockValue", { value: item.currentStock })}
                  </Link>
                ))
              ) : (
                <div className="mt-2 text-xs text-zinc-500">{t("alertEmpty")}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="flex h-56 flex-col rounded-2xl border border-white/10 bg-base-900">
          <CardHeader>
            <CardTitle className="text-lg text-white">{t("proofsTitle")}</CardTitle>
            <CardDescription>{t("proofsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="no-scrollbar flex-1 space-y-3 overflow-y-auto text-sm text-zinc-200">
            {alerts?.pendingProofs?.length ? (
              alerts.pendingProofs.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/sales/detail?id=${sale.id}`}
                  className="block rounded-lg border border-white/10 bg-base-950/40 px-3 py-2 text-xs text-white"
                >
                  {t("proofsSaleLabel", { id: sale.id })} · {formatMoney(sale.totalAmount)}
                </Link>
              ))
            ) : (
              <div className="text-xs text-zinc-500">{t("alertEmpty")}</div>
            )}
          </CardContent>
        </Card>

        <Card className="flex h-56 flex-col rounded-2xl border border-white/10 bg-base-900">
          <CardHeader>
            <CardTitle className="text-lg text-white">{t("tournamentAlertTitle")}</CardTitle>
            <CardDescription>{t("tournamentAlertSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="no-scrollbar flex-1 space-y-3 overflow-y-auto text-sm text-zinc-200">
            {alerts?.tournamentsWithoutWinners?.length ? (
              alerts.tournamentsWithoutWinners.map((item) => (
                <Link
                  key={item.id}
                  href={`/tournaments/detail?id=${item.id}`}
                  className="block rounded-lg border border-white/10 bg-base-950/40 px-3 py-2 text-xs text-white"
                >
                  {item.name} · {item.date}
                </Link>
              ))
            ) : (
              <div className="text-xs text-zinc-500">{t("alertEmpty")}</div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="flex h-56 flex-col rounded-2xl border border-white/10 bg-base-900">
          <CardHeader>
            <CardTitle className="text-lg text-white">{t("activityTitle")}</CardTitle>
            <CardDescription>{t("activitySubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="no-scrollbar flex-1 space-y-3 overflow-y-auto text-sm text-zinc-200">
            {summary?.recentActivity?.length ? (
              summary.recentActivity.map((item) => {
                const href =
                  item.type === "SALE"
                    ? `/sales/detail?id=${item.id}`
                    : item.type === "CUSTOMER"
                      ? `/customers/credit?id=${item.id}`
                      : `/tournaments/detail?id=${item.id}`;
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={href}
                    className="block rounded-lg border border-white/10 bg-base-950/40 px-3 py-2 text-xs text-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{item.label}</span>
                      <span className="text-[10px] text-zinc-400">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-xs text-zinc-500">{t("activityEmpty")}</div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
