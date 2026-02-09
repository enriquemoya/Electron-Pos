import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { fetchCatalogProducts } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminTableControls } from "@/components/admin/admin-table-controls";

export default async function ProductsPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: { page?: string; pageSize?: string; query?: string; sort?: string; direction?: string };
}) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminProducts" });
  const page = Number(searchParams?.page ?? 1) || 1;
  const pageSize = Number(searchParams?.pageSize ?? 20) || 20;
  const query = searchParams?.query ?? "";
  const sort = searchParams?.sort ?? "updatedAt";
  const direction = searchParams?.direction ?? "desc";

  const result = await fetchCatalogProducts({ page, pageSize, query, sort, direction });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
          <p className="text-sm text-white/60">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${params.locale}/admin/products/new`}
          className="rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-black"
        >
          {t("actions.create")}
        </Link>
      </div>

      <AdminTableControls
        basePath={`/${params.locale}/admin/products`}
        page={page}
        pageSize={pageSize}
        hasMore={result.hasMore}
        query={query}
        sort={sort}
        direction={direction === "asc" ? "asc" : "desc"}
        sortOptions={[
          { value: "updatedAt", label: t("sort.updated") },
          { value: "name", label: t("sort.name") },
          { value: "price", label: t("sort.price") }
        ]}
        labels={{
          search: t("search"),
          prev: t("pagination.prev"),
          next: t("pagination.next"),
          pageSize: t("pagination.pageSize"),
          sort: t("pagination.sort")
        }}
      />

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr>
              <th className="px-4 py-3">{t("columns.product")}</th>
              <th className="px-4 py-3">{t("columns.category")}</th>
              <th className="px-4 py-3">{t("columns.action")}</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.productId} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <div className="text-white">{item.displayName ?? item.productId}</div>
                  <div className="text-xs text-white/50">{item.productId}</div>
                </td>
                <td className="px-4 py-3">{item.category ?? t("labels.uncategorized")}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${params.locale}/admin/products/${item.productId}`}
                    className="text-sm text-amber-300 hover:text-amber-200"
                  >
                    {t("actions.edit")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
