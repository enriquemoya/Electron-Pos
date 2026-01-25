"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { t } from "../i18n";

type BackupItem = {
  id: string;
  filename: string;
  createdAt: string;
  sizeBytes: number;
};

type DbHealth = {
  status: string;
  message: string | null;
};

type BackupStatus = {
  status: string;
  at: string | null;
  message: string | null;
};

declare global {
  interface Window {
    api?: {
      dataSafety?: {
        listBackups: () => Promise<BackupItem[]>;
        getBackupStatus: () => Promise<BackupStatus>;
        restoreBackup: (payload: { filename: string; confirm: boolean }) => Promise<{ restored: boolean }>;
        restartApp: () => Promise<{ restarted: boolean }>;
        getDbHealth: () => Promise<DbHealth>;
      };
    };
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes)) {
    return "";
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} ${t("sizeUnitKb")}`;
  }
  return `${(kb / 1024).toFixed(1)} ${t("sizeUnitMb")}`;
}

export default function DbErrorPage() {
  const router = useRouter();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);

  useEffect(() => {
    const api = window.api?.dataSafety;
    if (!api) {
      setLoading(false);
      return;
    }
    Promise.all([api.listBackups(), api.getDbHealth(), api.getBackupStatus()])
      .then(([items, health, status]) => {
        setBackups(items);
        setDbHealth(health);
        setBackupStatus(status);
      })
      .catch(() => setError(t("errorLoad")))
      .finally(() => setLoading(false));
  }, []);

  const handleRestore = async (filename: string) => {
    const api = window.api?.dataSafety;
    if (!api) {
      return;
    }
    const confirmed = window.confirm(t("confirmRestore"));
    if (!confirmed) {
      return;
    }
    try {
      await api.restoreBackup({ filename, confirm: true });
    } catch {
      setError(t("errorRestore"));
    }
  };

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

  const canGoHome = dbHealth?.status === "OK";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <Card className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-white">
        <h1 className="text-2xl font-semibold">{t("dbTitle")}</h1>
        <p className="mt-2 text-sm text-red-100/90">{t("dbDescription")}</p>
        {dbHealth?.message ? (
          <p className="mt-2 text-xs text-red-100/70">{dbHealth.message}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            disabled={!canGoHome}
            className="border border-white/10 text-white"
          >
            {t("actionHome")}
          </Button>
          <Button type="button" onClick={handleRestart} className="border border-white/10 bg-white/10">
            {t("actionRestart")}
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl border border-white/10 bg-base-900 p-6 text-white">
        <h2 className="text-lg font-semibold">{t("backupsTitle")}</h2>
        {loading ? <p className="mt-3 text-sm text-zinc-400">{t("loading")}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        {backupStatus ? (
          <p className="mt-3 text-xs text-zinc-400">
            {t("backupsLast")}: {backupStatus.status}
            {backupStatus.at ? ` ${t("separator")} ${formatDate(backupStatus.at)}` : ""}
          </p>
        ) : null}
        {!loading && backups.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">{t("backupsEmpty")}</p>
        ) : null}
        <div className="mt-3 grid gap-3">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div>
                <div className="text-sm font-medium text-white">{backup.filename}</div>
                <div className="text-xs text-zinc-400">
                  {t("dateLabel")}: {formatDate(backup.createdAt)} {t("separator")} {t("sizeLabel")}: {formatSize(backup.sizeBytes)}
                </div>
              </div>
              <Button type="button" onClick={() => handleRestore(backup.filename)}>
                {t("actionRestore")}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
