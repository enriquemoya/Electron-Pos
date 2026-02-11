import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/navigation";
import { fetchCustomerOrders } from "@/lib/order-api";
import { BackButton } from "@/components/common/back-button";

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    return fallback;
  }
  return parsed;
}

function buildHref(page: number, pageSize: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return `/account/orders?${params.toString()}`;
}

export default async function AccountOrdersPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: { page?: string; pageSize?: string };
}) {
  setRequestLocale(params.locale);

  const token = cookies().get("auth_access")?.value;
  if (!token) {
    redirect(`/${params.locale}/auth/login`);
  }

  const t = await getTranslations({ locale: params.locale, namespace: "accountOrders" });
  const tNav = await getTranslations({ locale: params.locale, namespace: "navigation" });
  const page = parsePositiveInt(searchParams?.page, 1);
  const pageSize = parsePositiveInt(searchParams?.pageSize, 20);
  let result: Awaited<ReturnType<typeof fetchCustomerOrders>> | null = null;
  let loadError = false;
  try {
    result = await fetchCustomerOrders({ page, pageSize });
  } catch {
    loadError = true;
  }
  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / (result?.pageSize ?? pageSize)));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <BackButton label={tNav("back")} fallbackHref={`/${params.locale}/account/profile`} className="text-white/70" />
        <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-white/60">{t("subtitle")}</p>
      </div>

      {loadError || !result ? (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {t("error")}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="bg-white/5 text-xs uppercase text-white/50">
                <tr>
                  <th className="px-4 py-3">{t("columns.order")}</th>
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
                        <p className="text-white">{item.id}</p>
                        <p className="text-xs text-white/50">{new Date(item.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">{t(`statuses.${item.status}`)}</td>
                      <td className="px-4 py-3">{item.currency} {item.subtotal.toFixed(2)}</td>
                      <td className="px-4 py-3">{new Date(item.expiresAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/account/orders/${item.id}`}
                          className="text-sm text-amber-300 hover:text-amber-200"
                        >
                          {t("actions.view")}
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-white/50" colSpan={5}>
                      {t("empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-white/60">{t("pagination.label", { page: result.page, total: totalPages })}</p>
            <div className="flex items-center gap-2">
              <Link
                href={buildHref(Math.max(1, result.page - 1), result.pageSize)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  result.page > 1
                    ? "border-white/20 text-white hover:border-white/40"
                    : "pointer-events-none border-white/10 text-white/30"
                }`}
              >
                {t("pagination.prev")}
              </Link>
              <Link
                href={buildHref(result.page + 1, result.pageSize)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  result.hasMore
                    ? "border-white/20 text-white hover:border-white/40"
                    : "pointer-events-none border-white/10 text-white/30"
                }`}
              >
                {t("pagination.next")}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
