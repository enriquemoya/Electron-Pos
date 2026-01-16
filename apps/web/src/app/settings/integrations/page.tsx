import { PageHeader } from "@pos/ui";
import { DriveStatus } from "./components/drive-status";
import { t } from "./i18n";

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <DriveStatus />
    </div>
  );
}
