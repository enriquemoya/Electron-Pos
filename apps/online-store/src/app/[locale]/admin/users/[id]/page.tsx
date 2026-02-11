import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireAdmin } from "@/lib/admin-guard";
import { fetchAdminUser } from "@/lib/admin-api";
import { UserRoleStatusForm } from "@/components/admin/users/user-role-status-form";
import { BackButton } from "@/components/common/back-button";
import { updateUserAction } from "./actions";

export default async function AdminUserDetailPage({
  params
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminUsers" });

  try {
    const data = await fetchAdminUser(params.id);
    const user = data.user;

    return (
      <div className="space-y-6">
        <BackButton
          label={t("actions.back")}
          fallbackHref={`/${params.locale}/admin/users`}
          className="px-0 text-sm text-white/70 hover:text-white"
        />
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("detailTitle")}</h1>
          <p className="text-sm text-white/60">{t("detailSubtitle")}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-base-800/60 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-white/40">{t("fields.name")}</p>
              <p className="text-sm text-white">
                {user.firstName || user.lastName
                  ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                  : t("nameFallback")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-white/40">{t("fields.contact")}</p>
              <p className="text-sm text-white">{user.email ?? user.phone ?? t("contactFallback")}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-white/40">{t("fields.birthDate")}</p>
              <p className="text-sm text-white">{user.birthDate ?? t("birthDateEmpty")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-base-800/60 p-6">
          <h2 className="text-lg font-semibold text-white">{t("updateTitle")}</h2>
          <p className="text-sm text-white/60">{t("updateSubtitle")}</p>

          <div className="mt-4">
            <UserRoleStatusForm
              initialRole={user.role}
              initialStatus={user.status}
              labels={{
                roleLabel: t("fields.role"),
                statusLabel: t("fields.status"),
                roleCustomer: t("roles.CUSTOMER"),
                roleAdmin: t("roles.ADMIN"),
                statusActive: t("statuses.ACTIVE"),
                statusDisabled: t("statuses.DISABLED"),
                updateAction: t("updateAction"),
                confirmTitle: t("confirm.title"),
                confirmBody: t("confirm.body"),
                confirmPrimary: t("confirm.confirm"),
                confirmCancel: t("confirm.cancel"),
                errorGeneric: t("updateError"),
                toastSuccess: t("toast.saveSuccess"),
                toastError: t("toast.saveError")
              }}
              onUpdate={updateUserAction.bind(null, params.locale, user.id)}
            />
          </div>
        </div>
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
