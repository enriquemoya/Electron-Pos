import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { adjustInventory, fetchInventory } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTableControls } from "@/components/admin/admin-table-controls";

async function adjustInventoryAction(formData: FormData) {
  "use server";
  const productId = String(formData.get("productId") ?? "");
  const delta = Number(formData.get("delta"));
  const reason = String(formData.get("reason") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");

  if (!productId || !Number.isFinite(delta) || !reason) {
    return;
  }

  await adjustInventory(productId, { delta, reason });
  revalidatePath(`/${locale}/admin/inventory`);
}

export default async function InventoryPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: { page?: string; pageSize?: string; query?: string; sort?: string; direction?: string };
}) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminInventory" });
  const page = Number(searchParams?.page ?? 1) || 1;
  const pageSize = Number(searchParams?.pageSize ?? 20) || 20;
  const query = searchParams?.query ?? "";
  const sort = searchParams?.sort ?? "updatedAt";
  const direction = searchParams?.direction ?? "desc";

  const result = await fetchInventory({ page, pageSize, query, sort, direction });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-white/60">{t("subtitle")}</p>
      </div>

      <AdminTableControls
        basePath={`/${params.locale}/admin/inventory`}
        page={page}
        pageSize={pageSize}
        hasMore={result.hasMore}
        query={query}
        sort={sort}
        direction={direction === "asc" ? "asc" : "desc"}
        sortOptions={[
          { value: "updatedAt", label: t("sort.updated") },
          { value: "name", label: t("sort.name") },
          { value: "available", label: t("sort.available") }
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
              <th className="px-4 py-3">{t("columns.available")}</th>
              <th className="px-4 py-3">{t("columns.adjust")}</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.productId} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <div className="text-white">{item.displayName ?? item.productId}</div>
                  <div className="text-xs text-white/50">{item.category ?? t("labels.uncategorized")}</div>
                </td>
                <td className="px-4 py-3 text-white">{item.available}</td>
                <td className="px-4 py-3">
                  <form action={adjustInventoryAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="productId" value={item.productId} />
                    <input type="hidden" name="locale" value={params.locale} />
                    <Input
                      name="delta"
                      type="number"
                      step="1"
                      className="h-8 w-20"
                      placeholder={t("actions.delta")}
                      required
                    />
                    <Input
                      name="reason"
                      className="h-8 min-w-[180px]"
                      placeholder={t("actions.reason")}
                      required
                    />
                    <Button type="submit" size="sm">
                      {t("actions.apply")}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
