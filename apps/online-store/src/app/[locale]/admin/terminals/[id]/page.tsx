import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { TerminalDetailActions } from "@/components/admin/terminals/terminal-detail-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-guard";
import { fetchAdminTerminals } from "@/lib/admin-api";
import { Link } from "@/navigation";

const statusTones: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-200",
  ACTIVE: "bg-emerald-500/20 text-emerald-200",
  REVOKED: "bg-red-500/20 text-red-200"
};

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return fallback;
  }
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default async function AdminTerminalDetailPage({
  params
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const locale = params.locale === "en" ? "en" : "es";

  const [terminals, t, tSeo, tAdmin] = await Promise.all([
    fetchAdminTerminals(),
    getTranslations({ locale: params.locale, namespace: "adminTerminals" }),
    getTranslations({ locale: params.locale, namespace: "seo.breadcrumb" }),
    getTranslations({ locale: params.locale, namespace: "adminDashboard" })
  ]);

  const terminal = terminals.find((item) => item.id === params.id);
  if (!terminal) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <AdminBreadcrumb
        locale={params.locale}
        homeLabel={tSeo("home")}
        adminLabel={tAdmin("title")}
        items={[{ label: t("title"), href: `/${params.locale}/admin/terminals` }, { label: terminal.name }]}
      />

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="space-y-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{terminal.name}</h1>
            <p className="text-sm text-white/60">{t("detail.subtitle")}</p>
            <Badge className={statusTones[terminal.status] || "bg-white/10 text-white"}>{t(`status.${terminal.status.toLowerCase()}`)}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/terminals">{t("detail.back")}</Link>
            </Button>
            <TerminalDetailActions
              terminalId={terminal.id}
              terminalName={terminal.name}
              isRevoked={terminal.status === "REVOKED"}
              labels={{
                regenerate: t("detail.regenerate"),
                regenerating: t("detail.regenerating"),
                revoke: t("detail.revoke"),
                revokeDisabled: t("detail.revokeDisabled"),
                regenerateDialog: {
                  title: t("create.key.title"),
                  description: t("create.key.description"),
                  hint: t("create.key.hint"),
                  copy: t("create.key.copy"),
                  copied: t("create.key.copied"),
                  close: t("create.key.close")
                },
                revokeDialog: {
                  title: t("revoke.title"),
                  description: t("revoke.description", { name: "{name}" }),
                  cancel: t("revoke.cancel"),
                  confirm: t("revoke.confirm")
                },
                regenerateOk: t("toasts.regenerateOk"),
                regenerateError: t("toasts.regenerateError"),
                revokeOk: t("toasts.revokeOk"),
                revokeError: t("toasts.revokeError"),
                genericError: t("errors.generic"),
                unauthorized: t("errors.unauthorized"),
                notFound: t("errors.notFound"),
                revoked: t("errors.revoked"),
                rateLimited: t("errors.rateLimited")
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-base-900/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-white/50">{t("detail.fields.branch")}</dt>
              <dd className="mt-1 text-sm text-white">{terminal.branchName}</dd>
              <dd className="text-xs text-white/60">{terminal.branchCity || "-"}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-base-900/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-white/50">{t("detail.fields.lastRotation")}</dt>
              <dd className="mt-1 text-sm text-white">{formatDate(terminal.lastSeenAt, locale, t("table.never"))}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-base-900/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-white/50">{t("detail.fields.createdAt")}</dt>
              <dd className="mt-1 text-sm text-white">{formatDate(terminal.createdAt, locale, t("table.never"))}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-base-900/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-white/50">{t("detail.fields.revokedAt")}</dt>
              <dd className="mt-1 text-sm text-white">{formatDate(terminal.revokedAt, locale, t("detail.notRevoked"))}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
