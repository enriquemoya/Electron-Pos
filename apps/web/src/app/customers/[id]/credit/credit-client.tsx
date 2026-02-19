"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Customer, StoreCreditMovement } from "@pos/core";
import { t } from "./i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Balance = { amount: number; currency: "MXN" };

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount / 100);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function CreditClient() {
  const router = useRouter();
  const params = useParams();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState<Balance>({ amount: 0, currency: "MXN" });
  const [movements, setMovements] = useState<StoreCreditMovement[]>([]);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<StoreCreditMovement["reason"]>("MANUAL");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const api = window.api;
      if (!api || !customerId) {
        return;
      }
      try {
        const [detail, balanceResult, movementList] = await Promise.all([
          api.customers.getCustomerDetail(customerId),
          api.storeCredit.getBalance(customerId),
          api.storeCredit.listMovements(customerId)
        ]);
        setCustomer(detail);
        setBalance(balanceResult ?? { amount: 0, currency: "MXN" });
        setMovements(movementList ?? []);
      } catch {
        setError(t("errorLoad"));
      }
    };
    load();
  }, [customerId]);

  const handleGrant = async () => {
    const api = window.api;
    if (!api || !customerId) {
      return;
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError(t("errorGrant"));
      return;
    }
    const cents = Math.round(numericAmount * 100);
    const referenceType =
      reason === "TORNEO" ? "TOURNAMENT" : reason === "EVENTO" ? "EVENT" : "MANUAL";
    try {
      await api.storeCredit.grantCredit({
        customerId,
        amount: cents,
        reason,
        referenceType
      });
      const [balanceResult, movementList] = await Promise.all([
        api.storeCredit.getBalance(customerId),
        api.storeCredit.listMovements(customerId)
      ]);
      setBalance(balanceResult ?? { amount: 0, currency: "MXN" });
      setMovements(movementList ?? []);
      setAmount("");
      setError(null);
    } catch {
      setError(t("errorGrant"));
    }
  };

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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-zinc-400">{t("subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("customerLabel")}</div>
        <div className="mt-2 text-sm text-white">
          {customer
            ? `${customer.firstNames} ${customer.lastNamePaternal} ${customer.lastNameMaternal}`.trim()
            : t("emptyValue")}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("balanceLabel")}</div>
        <div className="mt-2 text-2xl font-semibold text-white">{formatMoney(balance.amount)}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <div className="mb-4 text-sm font-semibold text-white">{t("grantTitle")}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("amountLabel")}
            </label>
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={t("amountPlaceholder")}
              className="border-white/10 bg-base-900 text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("reasonLabel")}
            </label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as StoreCreditMovement["reason"])}
            >
              <SelectTrigger className="border-white/10 bg-base-900 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-base-900 text-white">
                <SelectItem value="TORNEO">{t("reasonTournament")}</SelectItem>
                <SelectItem value="EVENTO">{t("reasonEvent")}</SelectItem>
                <SelectItem value="MANUAL">{t("reasonManual")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error ? <div className="mt-3 text-sm text-rose-300">{error}</div> : null}
        <Button
          type="button"
          onClick={handleGrant}
          className="mt-4 bg-accent-500 text-black hover:bg-accent-600"
        >
          {t("grantAction")}
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <div className="mb-4 text-sm font-semibold text-white">{t("historyTitle")}</div>
        {movements.length === 0 ? (
          <div className="text-sm text-zinc-400">{t("movementEmpty")}</div>
        ) : (
          <div className="grid gap-2">
            {movements.map((movement) => {
              const isPositive = movement.amount.amount >= 0;
              return (
                <div
                  key={movement.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-base-950/40 px-3 py-2 text-sm text-white"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{movement.reason}</span>
                    <span className="text-xs text-zinc-500">{formatDateTime(movement.createdAt)}</span>
                  </div>
                  <span className={isPositive ? "text-emerald-300" : "text-rose-300"}>
                    {formatMoney(movement.amount.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
