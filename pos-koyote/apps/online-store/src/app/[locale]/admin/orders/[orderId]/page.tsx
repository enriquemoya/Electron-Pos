import { revalidatePath } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { fetchAdminOrder, transitionAdminOrderStatus } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";
import { OrderStatusTransitionForm } from "@/components/admin/order-status-transition-form";

async function transitionOrderStatusAction(formData: FormData) {
  "use server";

  const locale = String(formData.get("locale") ?? "es");
  const orderId = String(formData.get("orderId") ?? "");
  const toStatus = String(formData.get("toStatus") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!orderId || !toStatus) {
    redirect(`/${locale}/admin/orders/${orderId}?error=invalid`);
  }

  try {
    await transitionAdminOrderStatus(orderId, {
      toStatus,
      reason: reason || undefined
    });
  } catch {
    redirect(`/${locale}/admin/orders/${orderId}?error=transition`);
  }

  revalidatePath(`/${locale}/admin/orders`);
  revalidatePath(`/${locale}/admin/orders/${orderId}`);
  redirect(`/${locale}/admin/orders/${orderId}`);
}

export default async function AdminOrderDetailPage({
  params,
  searchParams
}: {
  params: { locale: string; orderId: string };
  searchParams?: { error?: string };
}) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminOrders" });
  const data = await fetchAdminOrder(params.orderId);
  const order = data.order;
  const statusOptions = [
    { value: "CREATED", label: t("statuses.CREATED") },
    { value: "PENDING_PAYMENT", label: t("statuses.PENDING_PAYMENT") },
    { value: "PAID", label: t("statuses.PAID") },
    { value: "READY_FOR_PICKUP", label: t("statuses.READY_FOR_PICKUP") },
    { value: "SHIPPED", label: t("statuses.SHIPPED") },
    { value: "CANCELLED_EXPIRED", label: t("statuses.CANCELLED_EXPIRED") },
    { value: "CANCELLED_MANUAL", label: t("statuses.CANCELLED_MANUAL") }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("detailTitle")}</h1>
          <p className="text-sm text-white/60">{order.id}</p>
        </div>
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

      <OrderStatusTransitionForm
        action={transitionOrderStatusAction}
        locale={params.locale}
        orderId={order.id}
        defaultStatus={order.status}
        statusOptions={statusOptions}
        labels={{
          title: t("transition.title"),
          reason: t("transition.reason"),
          submit: t("transition.submit"),
          confirmTitle: t("transition.confirmTitle"),
          confirmBody: t("transition.confirmBody"),
          confirmAction: t("transition.confirmAction"),
          cancelAction: t("transition.cancelAction")
        }}
      />
      {searchParams?.error ? (
        <p className="mt-2 text-sm text-rose-300">{t("transition.error")}</p>
      ) : null}

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
            </div>
          ))}
        </div>
      </div>

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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
