import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { requireAdminOrEmployee } from "@/lib/admin-guard";
import { fetchAdminSummary } from "@/lib/admin-api";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";

export default async function AdminHomePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const auth = requireAdminOrEmployee(params.locale);
  if (auth.role === "EMPLOYEE") {
    redirect(`/${params.locale}/admin/orders`);
  }

  const t = await getTranslations({ locale: params.locale, namespace: "adminDashboard" });
  const tSeo = await getTranslations({ locale: params.locale, namespace: "seo.breadcrumb" });
  const summary = await fetchAdminSummary();

  const cards = [
    {
      label: t("cards.pendingShipments"),
      value: summary.pendingShipments
    },
    {
      label: t("cards.onlineSales"),
      value: `${summary.currency} ${summary.onlineSalesTotal.toFixed(2)}`
    }
  ];

  const links = [
    { href: `/${params.locale}/admin/users`, label: t("links.users") },
    { href: `/${params.locale}/admin/orders`, label: t("links.orders") },
    { href: `/${params.locale}/admin/inventory`, label: t("links.inventory") },
    { href: `/${params.locale}/admin/products`, label: t("links.products") },
    { href: `/${params.locale}/admin/taxonomies`, label: t("links.taxonomies") },
    { href: `/${params.locale}/admin/branches`, label: t("links.branches") },
    { href: `/${params.locale}/admin/blog`, label: t("links.blog") },
    { href: `/${params.locale}/admin/terminals`, label: t("links.terminals") },
    { href: `/${params.locale}/admin/proofs`, label: t("links.proofs") }
  ];

  return (
    <div className="space-y-8">
      <div>
        <AdminBreadcrumb locale={params.locale} homeLabel={tSeo("home")} adminLabel={t("title")} className="mb-2" />
        <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-white/60">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white transition hover:border-white/30"
          >
            <p className="text-sm text-white/70">{t("links.label")}</p>
            <p className="mt-2 text-base font-semibold">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
