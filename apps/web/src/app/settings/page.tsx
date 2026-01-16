import Link from "next/link";
import { Card, PageHeader } from "@pos/ui";
import { t } from "./i18n";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Card title={t("storeTitle")} description={t("storeDescription")} />
      <Link
        href="/settings/cash-register"
        className="rounded-2xl border border-white/10 bg-base-900 p-6 transition hover:bg-white/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-white">
              {t("cashRegisterTitle")}
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              {t("cashRegisterDescription")}
            </div>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white">
            {t("cashRegisterAction")}
          </span>
        </div>
      </Link>
      <Link
        href="/settings/integrations"
        className="rounded-2xl border border-white/10 bg-base-900 p-6 transition hover:bg-white/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-white">
              {t("integrationsTitle")}
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              {t("integrationsDescription")}
            </div>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white">
            {t("integrationsAction")}
          </span>
        </div>
      </Link>
      <Link
        href="/settings/game-types"
        className="rounded-2xl border border-white/10 bg-base-900 p-6 transition hover:bg-white/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-white">
              {t("gameTypesTitle")}
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              {t("gameTypesDescription")}
            </div>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white">
            {t("gameTypesAction")}
          </span>
        </div>
      </Link>
      <Link
        href="/settings/expansions"
        className="rounded-2xl border border-white/10 bg-base-900 p-6 transition hover:bg-white/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-white">
              {t("expansionsTitle")}
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              {t("expansionsDescription")}
            </div>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white">
            {t("expansionsAction")}
          </span>
        </div>
      </Link>
    </div>
  );
}
