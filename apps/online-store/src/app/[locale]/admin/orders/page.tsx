import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { fetchAdminOrders } from "@/lib/admin-api";
import { requireAdminOrEmployee } from "@/lib/admin-guard";
import { OrderTotalPopover } from "@/components/admin/order-total-popover";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";

const PAGE_SIZE_VALUES = new Set([20, 50, 100]);

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    return fallback;
  }
  return parsed;
}

function buildHref(
  locale: string,
  page: number,
  pageSize: number,
  query?: string,
  status?: string,
  sort?: string,
  direction?: string
) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (query) {
    params.set("query", query);
  }
  if (status) {
    params.set("status", status);
  }
  if (sort) {
    params.set("sort", sort);
  }
  if (direction) {
    params.set("direction", direction);
  }
  return `/${locale}/admin/orders?${params.toString()}`;
}

export default async function AdminOrdersPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: {
    page?: string;
    pageSize?: string;
    query?: string;
    status?: string;
    sort?: string;
    direction?: string;
  };
}) {
  setRequestLocale(params.locale);
  requireAdminOrEmployee(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminOrders" });
  const tSeo = await getTranslations({ locale: params.locale, namespace: "seo.breadcrumb" });
  const tAdmin = await getTranslations({ locale: params.locale, namespace: "adminDashboard" });
  const page = parsePositiveInt(searchParams?.page, 1);
  const pageSizeCandidate = parsePositiveInt(searchParams?.pageSize, 20);
  const pageSize = PAGE_SIZE_VALUES.has(pageSizeCandidate) ? pageSizeCandidate : 20;
  const query = (searchParams?.query || "").trim();
  const status = (searchParams?.status || "").trim();
  const sortCandidate = (searchParams?.sort || "").trim();
  const directionCandidate = (searchParams?.direction || "").trim().toLowerCase();
  const sort = sortCandidate === "status" || sortCandidate === "expiresAt" || sortCandidate === "subtotal" ? sortCandidate : "createdAt";
  const direction = directionCandidate === "asc" ? "asc" : "desc";

  const result = await fetchAdminOrders({
    page,
    pageSize,
    query: query || undefined,
    status: status || undefined,
    sort,
    direction
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const hasPrev = result.page > 1;
  const hasNext = result.hasMore;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <AdminBreadcrumb
          locale={params.locale}
          homeLabel={tSeo("home")}
          adminLabel={tAdmin("title")}
          items={[{ label: t("title") }]}
        />
        <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-white/60">{t("subtitle")}</p>
      </div>

      <form className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-7" method="get">
        <input
          type="text"
          name="query"
          defaultValue={query}
          placeholder={t("filters.search")}
          className="h-10 rounded-md border border-white/10 bg-base-800 px-3 text-sm text-white md:col-span-2"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-md border border-white/10 bg-base-800 px-3 text-sm text-white"
        >
          <option value="">{t("filters.allStatuses")}</option>
          <option value="CREATED">{t("statuses.CREATED")}</option>
          <option value="PENDING_PAYMENT">{t("statuses.PENDING_PAYMENT")}</option>
          <option value="PAID">{t("statuses.PAID")}</option>
          <option value="PAID_BY_TRANSFER">{t("statuses.PAID_BY_TRANSFER")}</option>
          <option value="READY_FOR_PICKUP">{t("statuses.READY_FOR_PICKUP")}</option>
          <option value="COMPLETED">{t("statuses.COMPLETED")}</option>
          <option value="CANCELLED_EXPIRED">{t("statuses.CANCELLED_EXPIRED")}</option>
          <option value="CANCELLED_MANUAL">{t("statuses.CANCELLED_MANUAL")}</option>
          <option value="CANCELLED_REFUNDED">{t("statuses.CANCELLED_REFUNDED")}</option>
          <option value="CANCELED">{t("statuses.CANCELED")}</option>
        </select>
        <select
          name="pageSize"
          defaultValue={String(pageSize)}
          className="h-10 rounded-md border border-white/10 bg-base-800 px-3 text-sm text-white"
        >
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="h-10 rounded-md border border-white/10 bg-base-800 px-3 text-sm text-white"
        >
          <option value="createdAt">{t("filters.sortCreatedAt")}</option>
          <option value="status">{t("filters.sortStatus")}</option>
          <option value="expiresAt">{t("filters.sortExpiresAt")}</option>
          <option value="subtotal">{t("filters.sortSubtotal")}</option>
        </select>
        <select
          name="direction"
          defaultValue={direction}
          className="h-10 rounded-md border border-white/10 bg-base-800 px-3 text-sm text-white"
        >
          <option value="desc">{t("filters.directionDesc")}</option>
          <option value="asc">{t("filters.directionAsc")}</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-md bg-amber-400 px-4 text-sm font-semibold text-black transition hover:bg-amber-300"
        >
          {t("filters.apply")}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr>
              <th className="px-4 py-3">{t("columns.order")}</th>
              <th className="px-4 py-3">{t("columns.customer")}</th>
              <th className="px-4 py-3">{t("columns.status")}</th>
              <th className="px-4 py-3">{t("columns.total")}</th>
              <th className="px-4 py-3">{t("columns.expires")}</th>
              <th className="px-4 py-3">{t("columns.action")}</th>
            </tr>
          </thead>
          <tbody>
            {result.items.length ? (
              result.items.map((item) => (
                <tr key={item.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <p className="text-white">{item.orderCode}</p>
                    <p className="text-xs text-white/50">{new Date(item.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white">{item.customer.name || t("customerFallback")}</p>
                    <p className="text-xs text-white/50">{item.customer.email || t("emailFallback")}</p>
                  </td>
                  <td className="px-4 py-3">{t(`statuses.${item.status}`)}</td>
                  <td className="px-4 py-3">
                    <OrderTotalPopover
                      currency={item.currency}
                      subtotal={item.totals?.subtotal ?? item.subtotal}
                      refundsTotal={item.totals?.refundsTotal ?? 0}
                      finalTotal={item.totals?.finalTotal ?? item.subtotal}
                      items={(item.totalsBreakdown?.items ?? []).map((entry) => ({
                        id: entry.id,
                        label: entry.label,
                        quantity: entry.quantity,
                        amount: entry.amount
                      }))}
                      refunds={(item.totalsBreakdown?.refunds ?? []).map((entry) => ({
                        orderItemId: entry.orderItemId,
                        label: entry.label,
                        state: entry.state,
                        amount: entry.amount
                      }))}
                      labels={{
                        subtotal: t("totals.subtotal"),
                        refunds: t("totals.refunds"),
                        finalTotal: t("totals.finalTotal"),
                        qty: t("qtyShort"),
                        full: t("refunds.fullOrder"),
                        fullTag: t("refunds.full"),
                        partialTag: t("refunds.partial")
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">{new Date(item.expiresAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${params.locale}/admin/orders/${item.id}`}
                      className="text-sm text-amber-300 hover:text-amber-200"
                    >
                      {t("actions.view")}
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-white/50" colSpan={6}>
                  {t("empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-white/60">
          {t("pagination.label", { page: result.page, total: totalPages })}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={buildHref(params.locale, Math.max(1, result.page - 1), result.pageSize, query, status, sort, direction)}
            className={`rounded-md border px-3 py-2 text-sm ${
              hasPrev
                ? "border-white/20 text-white hover:border-white/40"
                : "pointer-events-none border-white/10 text-white/30"
            }`}
          >
            {t("pagination.prev")}
          </Link>
          <Link
            href={buildHref(params.locale, result.page + 1, result.pageSize, query, status, sort, direction)}
            className={`rounded-md border px-3 py-2 text-sm ${
              hasNext
                ? "border-white/20 text-white hover:border-white/40"
                : "pointer-events-none border-white/10 text-white/30"
            }`}
          >
            {t("pagination.next")}
          </Link>
        </div>
      </div>
    </div>
  );
}
