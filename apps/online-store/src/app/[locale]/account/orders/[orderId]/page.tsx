import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { fetchCustomerOrder } from "@/lib/order-api";
import { Link } from "@/navigation";

export default async function AccountOrderDetailPage({
  params
}: {
  params: { locale: string; orderId: string };
}) {
  setRequestLocale(params.locale);

  const token = cookies().get("auth_access")?.value;
  if (!token) {
    redirect(`/${params.locale}/auth/login`);
  }

  const t = await getTranslations({ locale: params.locale, namespace: "accountOrders" });
  let order: Awaited<ReturnType<typeof fetchCustomerOrder>>["order"] | null = null;
  let loadError = false;
  try {
    const data = await fetchCustomerOrder(params.orderId);
    order = data.order;
  } catch {
    loadError = true;
  }

  if (loadError || !order) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("detailTitle")}</h1>
          <p className="text-sm text-white/60">{t("errorDetail")}</p>
        </div>
        <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {t("error")}
        </div>
        <div>
          <Link href="/account/orders" className="text-sm text-amber-300 hover:text-amber-200">
            {t("backToList")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t("detailTitle")}</h1>
        <p className="text-sm text-white/60">{order.id}</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-white/50">{t("columns.status")}</p>
          <p className="text-white">{t(`statuses.${order.status}`)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/50">{t("columns.total")}</p>
          <p className="text-white">{order.currency} {order.subtotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/50">{t("columns.created")}</p>
          <p className="text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/50">{t("columns.expires")}</p>
          <p className="text-white">{new Date(order.expiresAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-white/50">{t("branch")}</p>
          <p className="text-white">{order.pickupBranch?.name || t("branchFallback")}</p>
          <p className="text-xs text-white/50">{order.pickupBranch?.address || ""}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">{t("itemsTitle")}</h2>
        <div className="mt-4 divide-y divide-white/10">
          {order.items.map((item) => (
            <div key={item.id} className="grid gap-2 py-3 md:grid-cols-4 md:items-center">
              <p className="text-sm text-white">{item.productId}</p>
              <p className="text-sm text-white/70">{t("qty", { value: item.quantity })}</p>
              <p className="text-sm text-white/70">{item.currency} {item.priceSnapshot.toFixed(2)}</p>
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
                {entry.fromStatus ? t(`statuses.${entry.fromStatus}`) : t("timeline.initial")} {"->"} {t(`statuses.${entry.toStatus}`)}
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
