import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireAdmin } from "@/lib/admin-guard";
import { fetchAdminUsers } from "@/lib/admin-api";
import { Pagination } from "@/components/pagination";
import { Link } from "@/navigation";

const PAGE_SIZE = 20;

type AdminUsersPageProps = {
  params: { locale: string };
  searchParams: { page?: string };
};

function parsePage(value: string | undefined) {
  const parsed = Number(value ?? 1);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminUsersPage({ params, searchParams }: AdminUsersPageProps) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminUsers" });
  const page = parsePage(searchParams.page);

  try {
    const data = await fetchAdminUsers(page, PAGE_SIZE);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
          <p className="text-sm text-white/60">{t("subtitle")}</p>
        </div>

        {data.items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-base-800 p-6 text-sm text-white/60">
            {t("empty")}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-base-800/60">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_120px] gap-4 border-b border-white/10 px-6 py-3 text-xs uppercase text-white/40 md:grid">
              <span>{t("columns.name")}</span>
              <span>{t("columns.role")}</span>
              <span>{t("columns.status")}</span>
              <span>{t("columns.action")}</span>
            </div>
            <div className="divide-y divide-white/10">
              {data.items.map((user) => (
                <div
                  key={user.id}
                  className="grid gap-2 px-6 py-4 md:grid-cols-[1.5fr_1fr_1fr_120px] md:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {user.firstName || user.lastName
                        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                        : t("nameFallback")}
                    </p>
                    <p className="text-xs text-white/50">{user.email ?? user.phone ?? t("contactFallback")}</p>
                  </div>
                  <div className="text-sm text-white/70">{t(`roles.${user.role}`)}</div>
                  <div className="text-sm text-white/70">{t(`statuses.${user.status}`)}</div>
                  <div>
                    <Link href={`/admin/users/${user.id}`} className="text-sm text-accent-400 hover:text-accent-300">
                      {t("view")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          basePath="/admin/users"
          query={{ page: data.page, pageSize: data.pageSize }}
          labels={{
            label: t("pagination.label", {
              page: data.page,
              total: Math.max(1, Math.ceil(data.total / data.pageSize))
            }),
            prev: t("pagination.prev"),
            next: t("pagination.next")
          }}
        />
      </div>
    );
  } catch {
    return (
      <div className="rounded-xl border border-white/10 bg-base-800 p-6 text-sm text-white/60">
        {t("error")}
      </div>
    );
  }
}
