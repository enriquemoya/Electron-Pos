"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Customer, PaymentMethod, Sale } from "@pos/core";
import { requiresProof } from "@pos/core";
import { t } from "../i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

declare global {
  interface Window {
    api?: {
      salesHistory: {
        getSaleDetail: (saleId: string) => Promise<Sale | null>;
        attachProofToSale: (payload: {
          saleId: string;
          fileBuffer: ArrayBuffer;
          fileName: string;
          mimeType: string;
          method: PaymentMethod;
        }) => Promise<{ proofFileRef: string; fileName: string }>;
      };
      customers: {
        getCustomerDetail: (customerId: string) => Promise<Customer | null>;
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

export default function SalesDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleId = searchParams.get("id") ?? "";
  const [sale, setSale] = useState<Sale | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = window.api?.salesHistory;
    if (!api || !saleId) {
      return;
    }
    api.getSaleDetail(saleId).then(setSale).catch(() => setError(t("errorLoad")));
  }, [saleId]);

  useEffect(() => {
    const api = window.api?.customers;
    if (!api || !sale || sale.paymentMethod !== "CREDITO_TIENDA" || !sale.customerId) {
      setCustomer(null);
      return;
    }
    api.getCustomerDetail(sale.customerId).then(setCustomer).catch(() => setCustomer(null));
  }, [sale]);

  const handleAttachProof = async (file: File | null) => {
    if (!file || !sale) {
      return;
    }
    const api = window.api?.salesHistory;
    if (!api) {
      return;
    }
    const mimeType = file.type || "application/octet-stream";
    const isAllowed = mimeType.startsWith("image/") || mimeType === "application/pdf";
    if (!isAllowed) {
      setError(t("errorAttach"));
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      await api.attachProofToSale({
        saleId: sale.id,
        fileBuffer: buffer,
        fileName: file.name,
        mimeType,
        method: sale.paymentMethod
      });
      const refreshed = await api.getSaleDetail(sale.id);
      setSale(refreshed);
    } catch {
      setError(t("errorAttach"));
    }
  };

  const handlePrint = () => {
    if (!sale) {
      return;
    }
    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) {
      return;
    }
    const rows = sale.items
      .map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${formatMoney(item.lineTotal.amount)}</td></tr>`)
      .join("");
    const customerLine =
      sale.paymentMethod === "CREDITO_TIENDA"
        ? `<p>${t("detailCustomer")}: ${
            customer
              ? `${customer.firstNames} ${customer.lastNamePaternal} ${customer.lastNameMaternal}`.trim()
              : t("detailCustomerEmpty")
          }</p>`
        : "";
    win.document.write(`
      <html>
        <head><title>${t("reprintTicket")}</title></head>
        <body>
          <h1>${t("detailTitle")}</h1>
          <p>${t("tableTicket")}: ${sale.id}</p>
          <p>${t("tableDate")}: ${formatDate(sale.createdAt)}</p>
          <table border="1" cellspacing="0" cellpadding="4">
            <thead><tr><th>${t("detailItems")}</th><th>${t("quantityLabel")}</th><th>${t("tableTotal")}</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p>${t("tableTotal")}: ${formatMoney(sale.total.amount)}</p>
          <p>${t("detailPayment")}: ${methodLabel(sale.paymentMethod)}</p>
          ${customerLine}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  if (!saleId) {
    return <div className="text-sm text-zinc-400">{t("emptyState")}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="px-0 text-white hover:bg-transparent hover:text-zinc-200"
        >
          {t("backAction")}
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("detailTitle")}</h1>
          <p className="text-sm text-zinc-400">{sale?.id ?? ""}</p>
        </div>
        <Button
          type="button"
          onClick={handlePrint}
          className="border border-white/10 bg-white/10 text-white"
        >
          {t("reprintTicket")}
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
      ) : null}

      {sale ? (
        <Card className="rounded-2xl border border-white/10 bg-base-900 p-4">
          <div className="grid gap-4 text-sm text-zinc-300">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("tableTicket")}</div>
              <div className="text-white">{sale.id}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("tableDate")}</div>
              <div className="text-white">{formatDate(sale.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("detailPayment")}</div>
              <div className="text-white">{methodLabel(sale.paymentMethod)}</div>
            </div>
            {sale.paymentMethod === "CREDITO_TIENDA" ? (
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("detailCustomer")}</div>
                <div className="text-white">
                  {customer
                    ? `${customer.firstNames} ${customer.lastNamePaternal} ${customer.lastNameMaternal}`.trim()
                    : t("detailCustomerEmpty")}
                </div>
              </div>
            ) : null}
            {sale.paymentReference ? (
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("detailReference")}</div>
                <div className="text-white">{sale.paymentReference}</div>
              </div>
            ) : null}
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("detailItems")}</div>
              <div className="mt-2 grid gap-2">
                {sale.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span>
                      {item.quantity} x {formatMoney(item.lineTotal.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {sale.proofStatus === "PENDING" && requiresProof(sale.paymentMethod) ? (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              <div className="mb-2 font-semibold">{t("proofPending")}</div>
              <label className="text-xs uppercase tracking-[0.2em] text-amber-200/70">{t("attachProof")}</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  handleAttachProof(file);
                  event.target.value = "";
                }}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-base-900 px-3 py-2 text-sm text-white"
              />
              <div className="mt-2 text-xs text-amber-200/70">{t("attachProofHint")}</div>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
