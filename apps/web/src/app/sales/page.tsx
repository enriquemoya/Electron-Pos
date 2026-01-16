"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Customer, PaymentMethod, Sale } from "@pos/core";
import { t } from "./i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DatePreset = "today" | "last7" | "custom";

type Filters = {
  from?: string;
  to?: string;
  paymentMethod?: PaymentMethod;
  proofStatus?: "PENDING" | "ATTACHED";
  customerId?: string;
  page?: number;
  pageSize?: number;
};

declare global {
  interface Window {
    api?: {
      salesHistory: {
        listSales: (filters: Filters) => Promise<{
          items: Sale[];
          total: number;
          page: number;
          pageSize: number;
        }>;
      };
      customers: {
        searchCustomers: (query: string) => Promise<Customer[]>;
      };
    };
  }
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function localRangeFromInput(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function methodLabel(method: PaymentMethod) {
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

function proofLabel(status: Sale["proofStatus"]) {
  return status === "PENDING" ? t("proofPending") : t("proofAttached");
}

export default function SalesHistoryPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "ALL">("ALL");
  const [proofStatus, setProofStatus] = useState<"ALL" | "PENDING" | "ATTACHED">("ALL");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const filters = useMemo<Filters>(() => {
    const now = new Date();
    let from: string | undefined;
    let to: string | undefined;

    if (datePreset === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      from = start.toISOString();
      to = end.toISOString();
    }

    if (datePreset === "last7") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      from = start.toISOString();
      to = end.toISOString();
    }

    if (datePreset === "custom") {
      if (toDate) {
        const { startISO, endISO } = localRangeFromInput(toDate);
        to = endISO;
        if (!fromDate) {
          from = startISO;
        }
      }
      if (fromDate) {
        const { startISO } = localRangeFromInput(fromDate);
        from = startISO;
      }
    }

    return {
      from,
      to,
      paymentMethod: paymentMethod === "ALL" ? undefined : paymentMethod,
      proofStatus: proofStatus === "ALL" ? undefined : proofStatus,
      customerId: selectedCustomer?.id,
      page,
      pageSize
    };
  }, [datePreset, fromDate, toDate, paymentMethod, proofStatus, selectedCustomer, page, pageSize]);

  const loadSales = useCallback(async () => {
    const api = window.api?.salesHistory;
    if (!api) {
      return;
    }
    setLoading(true);
    try {
      const response = await api.listSales(filters);
      setSales(response?.items ?? []);
      setTotal(response?.total ?? 0);
      setError(null);
    } catch {
      setError(t("errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    const api = window.api?.customers;
    if (!api) {
      return;
    }
    if (!customerQuery.trim()) {
      setCustomerResults([]);
      return;
    }
    api
      .searchCustomers(customerQuery.trim())
      .then((results) => setCustomerResults(results ?? []))
      .catch(() => setCustomerResults([]));
  }, [customerQuery]);

  const resetFilters = () => {
    setDatePreset("today");
    setFromDate("");
    setToDate("");
    setPaymentMethod("ALL");
    setProofStatus("ALL");
    setCustomerQuery("");
    setSelectedCustomer(null);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-zinc-400">{t("subtitle")}</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
      ) : null}

      <Card className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <div className="mb-3 text-sm font-semibold text-white">{t("filtersTitle")}</div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterDateLabel")}</label>
            <select
              value={datePreset}
              onChange={(event) => {
                setDatePreset(event.target.value as DatePreset);
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-base-900 px-3 py-2 text-sm text-white"
            >
              <option value="today">{t("filterDateToday")}</option>
              <option value="last7">{t("filterDateLast7")}</option>
              <option value="custom">{t("filterDateCustom")}</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterFromLabel")}</label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
              disabled={datePreset !== "custom"}
              className="rounded-xl border border-white/10 bg-base-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterToLabel")}</label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setPage(1);
              }}
              disabled={datePreset !== "custom"}
              className="rounded-xl border border-white/10 bg-base-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterPaymentLabel")}</label>
            <select
              value={paymentMethod}
              onChange={(event) => {
                setPaymentMethod(event.target.value as PaymentMethod | "ALL");
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-base-900 px-3 py-2 text-sm text-white"
            >
              <option value="ALL">{t("filterAll")}</option>
              <option value="EFECTIVO">{t("methodCash")}</option>
              <option value="TRANSFERENCIA">{t("methodTransfer")}</option>
              <option value="TARJETA">{t("methodCard")}</option>
              <option value="CREDITO_TIENDA">{t("methodStoreCredit")}</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterProofLabel")}</label>
            <select
              value={proofStatus}
              onChange={(event) => {
                setProofStatus(event.target.value as "ALL" | "PENDING" | "ATTACHED");
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-base-900 px-3 py-2 text-sm text-white"
            >
              <option value="ALL">{t("filterAll")}</option>
              <option value="PENDING">{t("filterPending")}</option>
              <option value="ATTACHED">{t("filterAttached")}</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterCustomerLabel")}</label>
            <Input
              value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
              placeholder={t("filterCustomerPlaceholder")}
              className="border-white/10 bg-base-900 text-white"
            />
            {customerResults.length > 0 ? (
              <div className="rounded-xl border border-white/10 bg-base-950/60">
                {customerResults.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerQuery("");
                      setCustomerResults([]);
                      setPage(1);
                    }}
                    className="flex w-full flex-col gap-1 px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                  >
                    <span className="font-semibold">
                      {`${customer.firstNames} ${customer.lastNamePaternal} ${customer.lastNameMaternal}`.trim()}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {customer.phone ?? customer.email ?? ""}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            {selectedCustomer ? (
              <div className="text-xs text-zinc-400">
                {`${selectedCustomer.firstNames} ${selectedCustomer.lastNamePaternal} ${selectedCustomer.lastNameMaternal}`.trim()}
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={resetFilters} className="border-white/10 text-white">
            {t("clearFilters")}
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl border border-white/10 bg-base-900 p-4">
        {loading ? <div className="text-sm text-zinc-400">{t("loading")}</div> : null}
        {!loading && sales.length === 0 ? (
          <div className="text-sm text-zinc-400">{t("emptyState")}</div>
        ) : null}
        {!loading && sales.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tableTicket")}</TableHead>
                  <TableHead>{t("tableDate")}</TableHead>
                  <TableHead>{t("tableTotal")}</TableHead>
                  <TableHead>{t("tableMethod")}</TableHead>
                  <TableHead>{t("tableProof")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow
                    key={sale.id}
                    className="cursor-pointer hover:bg-white/5"
                    onClick={() => router.push(`/sales/detail?id=${sale.id}`)}
                  >
                    <TableCell>{sale.id}</TableCell>
                    <TableCell>{formatDate(sale.createdAt)}</TableCell>
                    <TableCell>{formatMoney(sale.total.amount)}</TableCell>
                    <TableCell>{methodLabel(sale.paymentMethod)}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          sale.proofStatus === "PENDING"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {proofLabel(sale.proofStatus)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">{t("pageLabel", { page, total: pageCount })}</div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 text-white"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {t("prevPage")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 text-white"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              {t("nextPage")}
            </Button>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number.parseInt(value, 10));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[110px] border-white/10 bg-base-900 text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-base-900 text-white">
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {t("pageSizeLabel", { size })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );
}
