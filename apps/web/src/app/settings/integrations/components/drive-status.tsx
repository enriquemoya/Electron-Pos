"use client";

import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n";

type SyncStatusPayload = {
  syncState?: {
    catalogSnapshotVersion: string | null;
    snapshotAppliedAt: string | null;
    lastDeltaSyncAt: string | null;
    lastReconcileAt: string | null;
    lastSyncErrorCode: string | null;
  };
  queue?: {
    queuedEvents: number;
    oldestPendingAt: string | null;
  };
  terminal?: {
    activated: boolean;
    status: string;
    branchId: string | null;
    terminalId: string | null;
    lastVerifiedAt: string | null;
  };
};

function formatDate(value?: string | null) {
  if (!value) {
    return t("notAvailable");
  }
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function DriveStatus() {
  const [status, setStatus] = useState<SyncStatusPayload | null>(null);
  const [busy, setBusy] = useState<"sync" | "reconcile" | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const syncApi = typeof window !== "undefined" ? window.api?.inventorySync : undefined;

  const refresh = async () => {
    if (!syncApi) {
      setStatus(null);
      return;
    }
    const next = (await syncApi.getSyncStatus()) as SyncStatusPayload;
    setStatus(next);
  };

  useEffect(() => {
    refresh();
  }, []);

  const terminalLabel = useMemo(() => {
    if (!status?.terminal?.activated) {
      return t("terminalNotActivated");
    }
    if (status.terminal.status === "offline") {
      return t("terminalOffline");
    }
    return t("terminalActive");
  }, [status]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-white">{t("driveTitle")}</div>
        <p className="text-sm text-zinc-400">{t("driveDescription")}</p>
        <p className="text-xs text-zinc-500">{t("helpLocalFirst")}</p>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">{t("statusLabel")}</span>
          <span className="text-base font-semibold text-white">{terminalLabel}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">{t("branchLabel")}</span>
          <span>{status?.terminal?.branchId ?? t("notAvailable")}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">{t("snapshotVersionLabel")}</span>
          <span>{status?.syncState?.catalogSnapshotVersion ?? t("notAvailable")}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">{t("queueLabel")}</span>
          <span>{status?.queue?.queuedEvents ?? 0}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">{t("lastSyncLabel")}</span>
          <span>{formatDate(status?.syncState?.lastDeltaSyncAt)}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">{t("lastReconcileLabel")}</span>
          <span>{formatDate(status?.syncState?.lastReconcileAt)}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">{t("oldestQueuedLabel")}</span>
          <span>{formatDate(status?.queue?.oldestPendingAt)}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={async () => {
            if (!syncApi) {
              return;
            }
            setBusy("sync");
            setResultMessage(null);
            try {
              const result = await syncApi.runSyncNow();
              setResultMessage(`${t("syncNowDone")} (${result?.catalog?.itemCount ?? 0})`);
              await refresh();
            } catch {
              setResultMessage(t("syncNowFailed"));
            } finally {
              setBusy(null);
            }
          }}
          disabled={!syncApi || busy !== null}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "sync" ? t("syncNowBusy") : t("syncNowAction")}
        </button>

        <button
          type="button"
          onClick={async () => {
            if (!syncApi) {
              return;
            }
            setBusy("reconcile");
            setResultMessage(null);
            try {
              const result = await syncApi.reconcileNow();
              const plan = result?.plan || {};
              setResultMessage(
                `${t("reconcileDone")} M:${plan.missing ?? 0} S:${plan.stale ?? 0} U:${plan.unknown ?? 0}`
              );
              await refresh();
            } catch {
              setResultMessage(t("reconcileFailed"));
            } finally {
              setBusy(null);
            }
          }}
          disabled={!syncApi || busy !== null}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "reconcile" ? t("reconcileBusy") : t("reconcileAction")}
        </button>

        <button
          type="button"
          onClick={refresh}
          disabled={!syncApi || busy !== null}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("refreshAction")}
        </button>
      </div>

      {resultMessage ? <p className="mt-3 text-xs text-zinc-300">{resultMessage}</p> : null}
      {!syncApi ? <p className="mt-3 text-xs text-zinc-500">{t("desktopOnlyNotice")}</p> : null}
    </div>
  );
}
