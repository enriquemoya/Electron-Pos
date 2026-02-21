"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

import { useCart } from "@/components/cart/cart-context";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/cart";
import { Link } from "@/navigation";

export type PickupBranch = {
  id: string;
  name: string;
  address: string;
  city: string;
  googleMapsUrl: string | null;
  imageUrl: string | null;
};

type DraftResponse = {
  draftId: string;
  items: Array<{
    productId: string;
    quantity: number;
    priceSnapshot: number;
    currency: string;
    availabilitySnapshot: string;
  }>;
  removedItems: Array<{ productId: string }>;
};

type OrderResponse = {
  orderId: string;
  orderNumber: number;
  orderCode: string;
  status: string;
  expiresAt: string;
};

export function CheckoutPage({ branches }: { branches: PickupBranch[] }) {
  const t = useTranslations("checkout");
  const tCommon = useTranslations();
  const { items, subtotal, replaceItems, clear, updateQuantity, removeItem } = useCart();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    branches.length ? branches[0].id : null
  );
  const [paymentMethod, setPaymentMethod] = useState<"PAY_IN_STORE" | "BANK_TRANSFER">("PAY_IN_STORE");
  const lastPayload = useRef<string | null>(null);

  const branchOptions = useMemo(() => branches, [branches]);
  const selectedBranch = useMemo(
    () => branchOptions.find((branch) => branch.id === selectedBranchId) ?? null,
    [branchOptions, selectedBranchId]
  );

  useEffect(() => {
    if (!items.length) {
      return;
    }
    const payload = JSON.stringify(
      items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        priceSnapshot: item.price,
        availabilitySnapshot: item.availability
      }))
    );
    if (lastPayload.current === payload) {
      return;
    }
    lastPayload.current = payload;

    const syncDraft = async () => {
      setIsSyncing(true);
      setError(null);
      setErrorDetail(null);

      const response = await fetch("/api/checkout/drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: JSON.parse(payload) })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        const detail = typeof data.error === "string" ? data.error : "";
        setError(detail === "unauthorized" ? "unauthorized" : "server");
        setErrorDetail(detail || null);
        toast.error(t("revalidation.title"), {
          description: t("revalidation.error")
        });
        setDraftId(null);
        setIsSyncing(false);
        return;
      }

      const data = (await response.json()) as DraftResponse;
      setDraftId(data.draftId);

      const nextItems = data.items
        .map((validated) => {
          const existing = items.find((item) => item.id === validated.productId);
          if (!existing) {
            return null;
          }
          return {
            ...existing,
            quantity: validated.quantity,
            price: validated.priceSnapshot,
            currency: validated.currency,
            availability: validated.availabilitySnapshot as typeof existing.availability
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      if (data.removedItems.length) {
        toast(t("revalidation.title"), {
          description: t("revalidation.removed")
        });
      } else {
        const hasChanges = nextItems.some((validated) => {
          const existing = items.find((item) => item.id === validated.id);
          if (!existing) return true;
          return (
            existing.quantity !== validated.quantity ||
            existing.price !== validated.price ||
            existing.currency !== validated.currency ||
            existing.availability !== validated.availability
          );
        });
        if (hasChanges) {
          toast(t("revalidation.title"), {
            description: t("revalidation.updated")
          });
        }
      }

      replaceItems(nextItems);
      setIsSyncing(false);
    };

    void syncDraft();
  }, [items, replaceItems, t, toast]);

  const onSubmit = async () => {
    if (!draftId || !selectedBranchId) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setErrorDetail(null);

    const response = await fetch("/api/checkout/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        draftId,
        paymentMethod,
        pickupBranchId: selectedBranchId
      })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      const detail = typeof data.error === "string" ? data.error : "";
      setError(detail === "unauthorized" ? "unauthorized" : "server");
      setErrorDetail(detail || null);
      setIsSubmitting(false);
      return;
    }

    const data = (await response.json()) as OrderResponse;
    setOrder(data);
    clear();
    setIsSubmitting(false);
  };

  if (!items.length && !order) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-base-800/60 p-10 text-center">
        <h1 className="text-2xl font-semibold text-white">{t("empty.title")}</h1>
        <p className="text-sm text-white/60">{t("empty.subtitle")}</p>
        <Button asChild className="mt-2">
          <Link href="/catalog">{t("empty.action")}</Link>
        </Button>
      </div>
    );
  }

  if (order) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-white/10 bg-base-800/60 p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">{t("success.title")}</h1>
          <p className="text-sm text-white/60">{t("success.subtitle")}</p>
        </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <p>
              {t("success.orderId")}: <span className="text-white">{order.orderCode}</span>
            </p>
            <p>
              {t("success.expires")}: <span className="text-white">{new Date(order.expiresAt).toLocaleDateString()}</span>
            </p>
          </div>
        <Button asChild>
          <Link href="/">{t("success.backHome")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
          <p className="text-sm text-white/60">{t("subtitle")}</p>
        </div>

        {isSyncing ? (
          <div className="rounded-2xl border border-white/10 bg-base-800/60 p-6 text-sm text-white/60">
            {t("status.syncing")}
          </div>
        ) : null}

        <div className="space-y-4">
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              imageFallbackAlt={t("imageFallbackAlt")}
              onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
              onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-white/10 bg-base-800/60 p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">{t("summary.title")}</h2>
          <p className="text-sm text-white/60">{t("summary.subtitle")}</p>
          <p className="text-xs text-amber-200">{tCommon("conversion.payInStore")}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-white/70">
          <span>{t("summary.subtotal")}</span>
          <span className="text-white">{formatMoney(subtotal, "MXN")}</span>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">{t("branches.title")}</h3>
          {branchOptions.length ? (
            <div className="space-y-3">
              <Select
                value={selectedBranchId ?? ""}
                onValueChange={(value) => setSelectedBranchId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("branches.select")} />
                </SelectTrigger>
                <SelectContent>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBranchId ? (
                <div className="flex items-center justify-between gap-2 text-xs text-white/60">
                  <p>{selectedBranch?.address}</p>
                  {selectedBranch?.googleMapsUrl ? (
                    <a
                      href={selectedBranch.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("branches.openMap")}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10"
                    >
                      <MapPin className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-white/40">{t("branches.noMapLink")}</span>
                  )}
                </div>
              ) : null}
              <p className="text-xs text-white/50">{tCommon("conversion.pickupWindow")}</p>
            </div>
          ) : (
            <p className="text-sm text-white/60">{t("branches.empty")}</p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">{t("payment.title")}</h3>
          <button
            type="button"
            onClick={() => setPaymentMethod("PAY_IN_STORE")}
            className={`w-full rounded-2xl border p-4 text-left text-sm transition ${
              paymentMethod === "PAY_IN_STORE"
                ? "border-amber-400/60 bg-amber-400/10 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
            }`}
          >
            <p className="text-white">{t("payment.payInStore")}</p>
            <p className="text-xs text-white/60">{t("payment.payInStoreHint")}</p>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("BANK_TRANSFER")}
            className={`w-full rounded-2xl border p-4 text-left text-sm transition ${
              paymentMethod === "BANK_TRANSFER"
                ? "border-amber-400/60 bg-amber-400/10 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
            }`}
          >
            <p className="text-white">{t("payment.bankTransfer")}</p>
            <p className="text-xs text-white/60">{t("payment.bankTransferHint")}</p>
          </button>
        </div>

        {error ? (
          <p className="text-sm text-rose-200">
            {error === "unauthorized" ? t("errors.unauthorized") : t("errors.server")}
          </p>
        ) : null}
        {error && errorDetail ? (
          <p className="text-xs text-rose-200">{t("errors.details", { detail: errorDetail })}</p>
        ) : null}

        <Button
          type="button"
          className="w-full"
          onClick={onSubmit}
          disabled={!draftId || !selectedBranchId || isSubmitting}
        >
          {isSubmitting ? t("actions.submitting") : t("actions.confirmPayment")}
        </Button>
      </div>
    </div>
  );
}
