"use client";

import { useEffect, useRef, useState } from "react";
import type { SyncState, SyncStatus } from "@pos/core";
import { createInitialSyncState } from "@pos/core";
import { t } from "../i18n";
import { importProductsFromExcel } from "@/app/products/services/excel-import";
import { applyImportResult } from "@/app/products/services/apply-import";

type DriveDeviceCode = {
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
  deviceCode: string;
};

type DriveDownloadResult = {
  fileBase64?: string;
};

type DriveSyncApi = {
  getState: () => Promise<SyncState>;
  connect: () => Promise<DriveDeviceCode>;
  complete: (deviceCode: DriveDeviceCode) => Promise<SyncState>;
  upload: (arrayBuffer?: ArrayBuffer) => Promise<SyncState>;
  download: (localSnapshot?: { products: unknown[]; inventory: unknown }) => Promise<DriveDownloadResult>;
};

declare global {
  interface Window {
    koyote?: {
      driveSync?: DriveSyncApi;
    };
    api?: {
      products: {
        getProducts: () => Promise<import("@pos/core").Product[]>;
      };
      inventory: {
        getInventory: () => Promise<import("@pos/core").InventoryState>;
      };
    };
  }
}

function statusLabel(status: SyncStatus) {
  switch (status) {
    case "CONNECTED":
      return t("statusConnected");
    case "UPLOADING":
      return t("statusUploading");
    case "DOWNLOADING":
      return t("statusDownloading");
    case "CONFLICT":
      return t("statusConflict");
    case "ERROR":
      return t("statusError");
    default:
      return t("statusNotConnected");
  }
}

function formatDate(value?: string) {
  if (!value) {
    return t("notAvailable");
  }
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function DriveStatus() {
  const [state, setState] = useState<SyncState>(createInitialSyncState());
  const [deviceCode, setDeviceCode] = useState<DriveDeviceCode | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [uploadBuffer, setUploadBuffer] = useState<ArrayBuffer | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncApi = typeof window !== "undefined" ? window.koyote?.driveSync : undefined;
  const canUpload = Boolean(uploadBuffer);
  const isDesktopReady = Boolean(syncApi);
  const canDownload = true;

  const loadSnapshot = async () => {
    const api = window.api;
    if (!api) {
      return null;
    }
    const [products, inventory] = await Promise.all([
      api.products.getProducts(),
      api.inventory.getInventory()
    ]);
    return { products: products ?? [], inventory: inventory ?? { items: {} } };
  };

  const refreshState = async () => {
    if (!syncApi) {
      return;
    }
    const nextState = await syncApi.getState();
    setState(nextState);
  };

  useEffect(() => {
    refreshState();
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-white">{t("driveTitle")}</div>
        <p className="text-sm text-zinc-400">{t("driveDescription")}</p>
        <p className="text-xs text-zinc-500">{t("helpLocalFirst")}</p>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("statusLabel")}
          </span>
          <span className="text-base font-semibold text-white">{statusLabel(state.status)}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("conflictsLabel")}
          </span>
          <span className="text-base font-semibold text-white">
            {state.conflictCount ? state.conflictCount : t("conflictsNone")}
          </span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("lastSyncLabel")}
          </span>
          <span>{formatDate(state.lastSyncAt)}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("lastUploadLabel")}
          </span>
          <span>{formatDate(state.lastUploadAt)}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("lastDownloadLabel")}
          </span>
          <span>{formatDate(state.lastDownloadAt)}</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!isDesktopReady}
          className={`rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white transition ${
            isDesktopReady ? "bg-white/10 hover:bg-white/20" : "cursor-not-allowed bg-white/5 opacity-60"
          }`}
        >
          {t("selectFileAction")}
        </button>
        <button
          type="button"
          onClick={async () => {
            if (!syncApi) {
              return;
            }
            const code = await syncApi.connect();
            setDeviceCode(code);
          }}
          disabled={!isDesktopReady}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            isDesktopReady
              ? "bg-accent-500 text-black hover:bg-accent-600"
              : "cursor-not-allowed bg-white/10 text-zinc-400"
          }`}
        >
          {t("connectAction")}
        </button>
        <button
          type="button"
          onClick={async () => {
            if (!syncApi) {
              return;
            }
            if (!uploadBuffer) {
              return;
            }
            setState(await syncApi.upload(uploadBuffer));
          }}
          disabled={!canUpload || !isDesktopReady}
          className={`rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white transition ${
            canUpload && isDesktopReady
              ? "bg-white/10 hover:bg-white/20"
              : "cursor-not-allowed bg-white/5 opacity-60"
          }`}
        >
          {t("uploadAction")}
        </button>
        <button
          type="button"
          onClick={async () => {
            if (!syncApi) {
              return;
            }
            const snapshot = await loadSnapshot();
            if (!snapshot) {
              return;
            }
            await syncApi.download(snapshot);
            refreshState();
          }}
          disabled={!isDesktopReady}
          className={`rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white transition ${
            isDesktopReady
              ? "bg-white/10 hover:bg-white/20"
              : "cursor-not-allowed bg-white/5 opacity-60"
          }`}
        >
          {t("downloadAction")}
        </button>
        <button
          type="button"
          onClick={async () => {
            if (!syncApi) {
              return;
            }
            const snapshot = await loadSnapshot();
            if (!snapshot) {
              return;
            }
            const result = await syncApi.download(snapshot);
            if (!result.fileBase64) {
              return;
            }
            const buffer = Uint8Array.from(atob(result.fileBase64), (char) => char.charCodeAt(0))
              .buffer;
            const applied = importProductsFromExcel({
              file: buffer,
              products: snapshot.products,
              inventory: snapshot.inventory,
              nowIso: new Date().toISOString(),
              createId: () => crypto.randomUUID()
            });
            await applyImportResult(applied, snapshot.products, snapshot.inventory);
            refreshState();
          }}
          disabled={!canDownload || !isDesktopReady}
          className={`rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white transition ${
            canDownload && isDesktopReady
              ? "bg-white/10 hover:bg-white/20"
              : "cursor-not-allowed bg-white/5 opacity-60"
          }`}
        >
          {t("applyDriveAction")}
        </button>
        <button
          type="button"
          onClick={refreshState}
          disabled={!isDesktopReady}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          {t("refreshAction")}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }
          const buffer = await file.arrayBuffer();
          setUploadBuffer(buffer);
          setUploadFileName(file.name);
          event.target.value = "";
        }}
      />
      <div className="mt-3 text-xs text-zinc-500">
        {t("selectedFileLabel")}: {uploadFileName ?? t("noFileSelected")}
      </div>
      <div className="mt-2 text-xs text-zinc-500">{t("applyDriveNote")}</div>
      {!isDesktopReady ? (
        <div className="mt-4 text-xs text-zinc-500">
          <div>{t("desktopOnlyNotice")}</div>
          <div>{t("desktopOnlyAction")}</div>
        </div>
      ) : null}
      {deviceCode ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-base-900 p-4 text-sm text-zinc-300">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("connectPendingTitle")}
          </div>
          <p className="mt-2">{t("connectInstructions")}</p>
          <div className="mt-3 grid gap-2 text-xs text-zinc-400">
            <div>
              <span className="text-zinc-500">{t("connectUserCodeLabel")}: </span>
              <span className="text-white">{deviceCode.userCode}</span>
            </div>
            <div>
              <span className="text-zinc-500">{t("connectUrlLabel")}: </span>
              <span className="text-white">{deviceCode.verificationUri}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(deviceCode.verificationUri);
                  setCopyMessage(t("copyLinkSuccess"));
                } catch {
                  setCopyMessage(t("copyLinkError"));
                }
                setTimeout(() => setCopyMessage(null), 2000);
              }}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              {t("copyLinkLabel")}
            </button>
            {copyMessage ? <span>{copyMessage}</span> : null}
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!syncApi) {
                return;
              }
              const nextState = await syncApi.complete(deviceCode);
              setState(nextState);
              setDeviceCode(null);
            }}
            className="mt-4 rounded-xl bg-accent-500 px-4 py-2 text-xs font-semibold text-black transition hover:bg-accent-600"
          >
            {t("connectFinishAction")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

