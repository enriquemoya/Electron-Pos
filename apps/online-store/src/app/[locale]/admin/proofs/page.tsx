import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { requireAdmin } from "@/lib/admin-guard";
import { fetchAdminProofMedia } from "@/lib/admin-api";

type Props = {
  params: { locale: string };
  searchParams: {
    page?: string;
    branchId?: string;
    q?: string;
  };
};

export default async function AdminProofsPage({ params, searchParams }: Props) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminProofs" });
  const tSeo = await getTranslations({ locale: params.locale, namespace: "seo.breadcrumb" });

  const page = Number(searchParams.page || "1");
  const result = await fetchAdminProofMedia({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 20,
    branchId: searchParams.branchId,
    q: searchParams.q
  });

  return (
    <div className="space-y-6">
      <div>
        <AdminBreadcrumb
          locale={params.locale}
          homeLabel={tSeo("home")}
          adminLabel={tSeo("admin")}
          items={[{ label: t("title") }]}
          className="mb-2"
        />
        <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-white/60">{t("subtitle")}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-white/70">
            <tr>
              <th className="px-4 py-3">{t("table.createdAt")}</th>
              <th className="px-4 py-3">{t("table.branch")}</th>
              <th className="px-4 py-3">{t("table.terminal")}</th>
              <th className="px-4 py-3">{t("table.sale")}</th>
              <th className="px-4 py-3">{t("table.mime")}</th>
              <th className="px-4 py-3">{t("table.size")}</th>
              <th className="px-4 py-3">{t("table.url")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/90">
            {result.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.branchId}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.terminalId}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.saleId || "-"}</td>
                <td className="px-4 py-3">{item.mime}</td>
                <td className="px-4 py-3">{item.sizeBytes}</td>
                <td className="px-4 py-3">
                  <a className="text-sky-300 underline" href={item.url} target="_blank" rel="noreferrer">
                    {t("table.open")}
                  </a>
                </td>
              </tr>
            ))}
            {result.items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-white/60" colSpan={7}>
                  {t("empty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
