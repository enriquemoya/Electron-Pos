import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { AdminTerminalsPage } from "@/components/admin/terminals/admin-terminals-page";
import { requireAdmin } from "@/lib/admin-guard";
import { fetchAdminBranches, fetchAdminTerminals } from "@/lib/admin-api";

const PAGE_SIZE = 10;
const PAGE_SIZE_CAP = 50;

function parsePage(value?: string) {
  const parsed = Number.parseInt(value || "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export default async function AdminTerminalsListPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { page?: string };
}) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const locale = params.locale === "en" ? "en" : "es";
  const requestedPage = parsePage(searchParams.page);

  const [terminals, branches, t, tSeo, tAdmin] = await Promise.all([
    fetchAdminTerminals(),
    fetchAdminBranches(),
    getTranslations({ locale: params.locale, namespace: "adminTerminals" }),
    getTranslations({ locale: params.locale, namespace: "seo.breadcrumb" }),
    getTranslations({ locale: params.locale, namespace: "adminDashboard" })
  ]);

  const pageSize = Math.min(PAGE_SIZE, PAGE_SIZE_CAP);
  const total = terminals.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const items = terminals.slice(offset, offset + pageSize);

  return (
    <div className="space-y-4">
      <AdminBreadcrumb
        locale={params.locale}
        homeLabel={tSeo("home")}
        adminLabel={tAdmin("title")}
        items={[{ label: t("title") }]}
      />
      <AdminTerminalsPage
        locale={locale}
        page={page}
        total={total}
        totalPages={totalPages}
        branches={branches}
        items={items}
        labels={{
          title: t("title"),
          subtitle: t("subtitle"),
          summary: t("summary"),
          create: {
            trigger: t("create.trigger"),
            title: t("create.title"),
            description: t("create.description"),
            nameLabel: t("create.fields.name"),
            namePlaceholder: t("create.fields.namePlaceholder"),
            branchLabel: t("create.fields.branch"),
            branchPlaceholder: t("create.fields.branchPlaceholder"),
            cancel: t("create.actions.cancel"),
            submit: t("create.actions.submit"),
            creating: t("create.actions.creating"),
            keyTitle: t("create.key.title"),
            keyDescription: t("create.key.description"),
            keyHint: t("create.key.hint"),
            copy: t("create.key.copy"),
            copied: t("create.key.copied"),
            close: t("create.key.close"),
            errors: {
              generic: t("errors.generic"),
              nameRequired: t("errors.nameRequired"),
              branchRequired: t("errors.branchRequired")
            },
            toasts: {
              created: t("toasts.created"),
              createError: t("toasts.createError")
            }
          },
          table: {
            columns: {
              name: t("table.columns.name"),
              branch: t("table.columns.branch"),
              status: t("table.columns.status"),
              lastRotation: t("table.columns.lastRotation"),
              createdAt: t("table.columns.createdAt"),
              actions: t("table.columns.actions")
            },
            status: {
              PENDING: t("status.pending"),
              ACTIVE: t("status.active"),
              REVOKED: t("status.revoked")
            },
            empty: t("table.empty"),
            never: t("table.never"),
            actions: {
              details: t("table.actions.details"),
              revoke: t("table.actions.revoke"),
              revoking: t("table.actions.revoking"),
              disabled: t("table.actions.disabled"),
              menuLabel: t("table.actions.menuLabel"),
              revokeDialog: {
                title: t("revoke.title"),
                description: t("revoke.description"),
                cancel: t("revoke.cancel"),
                confirm: t("revoke.confirm")
              }
            }
          },
          pagination: {
            prev: t("pagination.prev"),
            next: t("pagination.next"),
            page: t("pagination.page")
          },
          toasts: {
            revokeOk: t("toasts.revokeOk"),
            revokeError: t("toasts.revokeError")
          },
          errors: {
            generic: t("errors.generic"),
            unauthorized: t("errors.unauthorized"),
            notFound: t("errors.notFound"),
            revoked: t("errors.revoked"),
            rateLimited: t("errors.rateLimited")
          }
        }}
      />
    </div>
  );
}
