import { revalidatePath } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { createAdminRefund, fetchAdminOrder, transitionAdminOrderStatus } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";
import { OrderStatusTransitionForm } from "@/components/admin/order-status-transition-form";
import { OrderStatusToast } from "@/components/admin/order-status-toast";
import { OrderRefundForm } from "@/components/admin/order-refund-form";
import { Badge } from "@/components/ui/badge";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";

async function transitionOrderStatusAction(formData: FormData) {
  "use server";

  const locale = String(formData.get("locale") ?? "es");
  const orderId = String(formData.get("orderId") ?? "");
  const toStatus = String(formData.get("toStatus") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const adminMessage = String(formData.get("adminMessage") ?? "").trim();

  if (!orderId || !toStatus) {
    redirect(`/${locale}/admin/orders/${orderId}?error=invalid`);
  }

  try {
    await transitionAdminOrderStatus(orderId, {
      toStatus,
      reason: reason || undefined,
      adminMessage: adminMessage || undefined
    });
  } catch {
    redirect(`/${locale}/admin/orders/${orderId}?error=transition`);
  }

  revalidatePath(`/${locale}/admin/orders`);
  revalidatePath(`/${locale}/admin/orders/${orderId}`);
  redirect(`/${locale}/admin/orders/${orderId}?success=transition`);
}

async function createRefundAction(formData: FormData) {
  "use server";

  const locale = String(formData.get("locale") ?? "es");
  const orderId = String(formData.get("orderId") ?? "");
  const orderItemId = String(formData.get("orderItemId") ?? "").trim();
  const amount = Number(formData.get("amount") ?? "0");
  const refundMethod = String(formData.get("refundMethod") ?? "");
  const adminMessage = String(formData.get("adminMessage") ?? "").trim();

  if (!orderId || !Number.isFinite(amount) || amount <= 0 || !refundMethod || !adminMessage) {
    redirect(`/${locale}/admin/orders/${orderId}?error=refund`);
  }

  try {
    await createAdminRefund(orderId, {
      orderItemId: orderItemId || undefined,
      amount,
      refundMethod: refundMethod as "CASH" | "CARD" | "STORE_CREDIT" | "TRANSFER" | "OTHER",
      adminMessage
    });
  } catch {
    redirect(`/${locale}/admin/orders/${orderId}?error=refund`);
  }

  revalidatePath(`/${locale}/admin/orders`);
  revalidatePath(`/${locale}/admin/orders/${orderId}`);
  redirect(`/${locale}/admin/orders/${orderId}?success=refund`);
}

export default async function AdminOrderDetailPage({
  params,
  searchParams
}: {
  params: { locale: string; orderId: string };
  searchParams?: { error?: string; success?: string };
}) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminOrders" });
  const tSeo = await getTranslations({ locale: params.locale, namespace: "seo.breadcrumb" });
  const tAdmin = await getTranslations({ locale: params.locale, namespace: "adminDashboard" });
  const data = await fetchAdminOrder(params.orderId);
  const order = data.order;
  const isTerminal = ["COMPLETED", "CANCELED", "CANCELLED_EXPIRED", "CANCELLED_MANUAL", "CANCELLED_REFUNDED"].includes(
    order.status
  );
  const statusOptions = [
    { value: "CREATED", label: t("statuses.CREATED") },
    { value: "PENDING_PAYMENT", label: t("statuses.PENDING_PAYMENT") },
    { value: "PAID", label: t("statuses.PAID") },
    { value: "PAID_BY_TRANSFER", label: t("statuses.PAID_BY_TRANSFER") },
    { value: "READY_FOR_PICKUP", label: t("statuses.READY_FOR_PICKUP") },
    { value: "COMPLETED", label: t("statuses.COMPLETED") },
    { value: "CANCELLED_REFUNDED", label: t("statuses.CANCELLED_REFUNDED") },
    { value: "CANCELLED_EXPIRED", label: t("statuses.CANCELLED_EXPIRED") },
    { value: "CANCELLED_MANUAL", label: t("statuses.CANCELLED_MANUAL") }
  ];

  return (
    <div className="space-y-6">
      <OrderStatusToast
        success={searchParams?.success === "transition" || searchParams?.success === "refund"}
        error={
          searchParams?.error === "transition" ||
          searchParams?.error === "invalid" ||
          searchParams?.error === "refund"
        }
        successMessage={
          searchParams?.success === "refund" ? t("refund.toastSuccess") : t("transition.toastSuccess")
        }
        errorMessage={searchParams?.error === "refund" ? t("refund.toastError") : t("transition.toastError")}
      />
      <AdminBreadcrumb
        locale={params.locale}
        homeLabel={tSeo("home")}
        adminLabel={tAdmin("title")}
        items={[
          { label: t("title"), href: `/${params.locale}/admin/orders` },
          { label: t("detailTitle") }
        ]}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("detailTitle")}</h1>
          <p className="text-sm text-white/60">{order.orderCode}</p>
        </div>
        {order.status === "COMPLETED" ? (
          <OrderRefundForm
            action={createRefundAction}
            locale={params.locale}
            orderId={order.id}
            maxAmount={order.totals?.paidTotal ?? order.subtotal}
            items={order.items.map((item) => ({
              id: item.id,
              label: item.productId,
              maxRefundable: item.quantity * item.priceSnapshot
            }))}
            labels={{
              trigger: t("refund.trigger"),
              title: t("refund.title"),
              subtitle: t("refund.subtitle"),
              itemLabel: t("refund.itemLabel"),
              fullOrder: t("refund.fullOrder"),
              amountLabel: t("refund.amountLabel"),
              amountHelp: t("refund.amountHelp"),
              methodLabel: t("refund.methodLabel"),
              messageLabel: t("refund.messageLabel"),
              messagePlaceholder: t("refund.messagePlaceholder"),
              submit: t("refund.submit"),
              cancel: t("refund.cancel"),
              methods: {
                CASH: t("refund.methods.CASH"),
                CARD: t("refund.methods.CARD"),
                STORE_CREDIT: t("refund.methods.STORE_CREDIT"),
                TRANSFER: t("refund.methods.TRANSFER"),
                OTHER: t("refund.methods.OTHER")
              }
            }}
          />
        ) : null}
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-white/50">{t("columns.status")}</p>
          <p className="text-white">{t(`statuses.${order.status}`)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/50">{t("columns.total")}</p>
          <p className="text-white">
            {order.currency} {order.subtotal.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/50">{t("columns.customer")}</p>
          <p className="text-white">{order.customer.name || t("customerFallback")}</p>
          <p className="text-xs text-white/50">{order.customer.email || t("emailFallback")}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/50">{t("branch")}</p>
          <p className="text-white">{order.pickupBranch?.name || t("branchFallback")}</p>
          <p className="text-xs text-white/50">{order.pickupBranch?.address || ""}</p>
        </div>
      </div>

      {!isTerminal ? (
        <OrderStatusTransitionForm
          action={transitionOrderStatusAction}
          locale={params.locale}
          orderId={order.id}
          defaultStatus={order.status}
          statusOptions={statusOptions}
          labels={{
            title: t("transition.title"),
            reason: t("transition.reason"),
            adminMessage: t("transition.adminMessage"),
            submit: t("transition.submit"),
            confirmTitle: t("transition.confirmTitle"),
            confirmBody: t("transition.confirmBody"),
            confirmAction: t("transition.confirmAction"),
            cancelAction: t("transition.cancelAction")
          }}
        />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
          {t("transition.disabledForTerminal")}
        </div>
      )}
      {searchParams?.error ? (
        <p className="mt-2 text-sm text-rose-300">{t("transition.error")}</p>
      ) : null}

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-white/50">{t("totals.subtotal")}</p>
          <p className="text-white">
            {order.currency} {(order.totals?.subtotal ?? order.subtotal).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/50">{t("totals.refunds")}</p>
          <p className="text-rose-300">
            - {order.currency} {(order.totals?.refundsTotal ?? 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/50">{t("totals.finalTotal")}</p>
          <p className="text-white">
            {order.currency} {(order.totals?.finalTotal ?? order.subtotal).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/50">{t("totals.paidTotal")}</p>
          <p className="text-white">
            {order.currency} {(order.totals?.paidTotal ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">{t("itemsTitle")}</h2>
        <div className="mt-4 divide-y divide-white/10">
          {order.items.map((item) => (
            <div key={item.id} className="grid gap-2 py-3 md:grid-cols-4 md:items-center">
              <p className="text-sm text-white">{item.productId}</p>
              <p className="text-sm text-white/70">{t("qty", { value: item.quantity })}</p>
              <p className="text-sm text-white/70">
                {item.currency} {item.priceSnapshot.toFixed(2)}
              </p>
              <p className="text-sm text-white/70">{item.availabilitySnapshot}</p>
              <div>
                {item.refundState ? (
                  <Badge state={item.refundState === "FULL" ? "LOW_STOCK" : item.refundState === "PARTIAL" ? "PENDING_SYNC" : "AVAILABLE"}>
                    {t(`refund.states.${item.refundState}`)}
                  </Badge>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {order.refunds?.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold text-white">{t("refund.historyTitle")}</h2>
          <div className="mt-4 space-y-3">
            {order.refunds.map((refund) => (
              <div key={refund.id} className="rounded-xl border border-white/10 bg-base-800/60 p-3">
                <p className="text-sm text-white">
                  {refund.refundMethod} - {refund.currency} {refund.amount.toFixed(2)}
                </p>
                <p className="text-xs text-white/60">
                  {t("refund.byAdmin", { name: refund.adminDisplayName })}
                </p>
                <p className="text-xs text-white/60">{refund.adminMessage}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">{t("timelineTitle")}</h2>
        <div className="mt-4 space-y-3">
          {order.timeline.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-white/10 bg-base-800/60 p-3">
              <p className="text-sm text-white">
                {entry.fromStatus ? t(`statuses.${entry.fromStatus}`) : t("timeline.initial")} {"->"}{" "}
                {t(`statuses.${entry.toStatus}`)}
              </p>
              <p className="text-xs text-white/60">{new Date(entry.createdAt).toLocaleString()}</p>
              {entry.reason ? <p className="text-xs text-white/60">{entry.reason}</p> : null}
              {entry.approvedByAdminName ? (
                <p className="text-xs text-white/70">
                  {t("timeline.approvedBy", { name: entry.approvedByAdminName })}
                </p>
              ) : null}
              {entry.adminMessage ? <p className="text-xs text-white/60">{entry.adminMessage}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
