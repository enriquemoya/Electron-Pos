"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { t } from "../i18n";

export default function DataErrorPage() {
  const router = useRouter();

  const handleRestart = async () => {
    const api = window.api?.dataSafety;
    if (!api) {
      return;
    }
    const confirmed = window.confirm(t("confirmRestart"));
    if (!confirmed) {
      return;
    }
    await api.restartApp();
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <Card className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-white">
        <h1 className="text-2xl font-semibold">{t("dataTitle")}</h1>
        <p className="mt-2 text-sm text-amber-100/90">{t("dataDescription")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push("/dashboard")}>
            {t("actionHome")}
          </Button>
          <Button type="button" onClick={handleRestart} className="border border-white/10 bg-white/10">
            {t("actionRestart")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
