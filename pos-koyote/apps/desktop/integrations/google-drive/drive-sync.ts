import { app } from "electron";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import type { InventoryState, Product } from "@pos/core";
import {
  createInitialSyncState,
  createMoney,
  reconcileInventorySnapshot,
  type RemoteProductInput,
  type ReconciliationResult,
  type SyncState
} from "@pos/core";
import {
  createDriveFolder,
  downloadDriveFile,
  getDriveFileMetadata,
  listDriveFiles,
  uploadDriveFile
} from "./drive-client";
import {
  loadTokens,
  pollForToken,
  refreshAccessToken,
  requestDeviceCode,
  saveTokens
} from "./drive-auth";
import type { DriveDeviceCode, DriveFileMetadata, DriveSyncConfig } from "./drive-types";

const SYNC_STATE_FILE = "drive-sync.json";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CATEGORY_VALUES: RemoteProductInput["category"][] = [
  "TCG_SEALED",
  "TCG_SINGLE",
  "ACCESSORY",
  "COMMODITY",
  "SERVICE"
];

const PROOF_BASE_FOLDER = "Comprobantes";

function getLocalDateFolder(value?: string): string {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("en-CA").format(date);
}

function syncStatePath() {
  const overridePath = process.env.DRIVE_SYNC_STATE_PATH;
  if (overridePath) {
    if (path.isAbsolute(overridePath)) {
      return overridePath;
    }
    // Resolve relative paths from the repo root (two levels up from apps/desktop).
    const repoRoot = path.resolve(app.getAppPath(), "..", "..");
    return path.resolve(repoRoot, overridePath);
  }
  return path.join(app.getPath("userData"), SYNC_STATE_FILE);
}

export function loadSyncState(): SyncState {
  const filePath = syncStatePath();
  if (!fs.existsSync(filePath)) {
    return createInitialSyncState();
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as SyncState;
}

export function saveSyncState(state: SyncState) {
  fs.writeFileSync(syncStatePath(), JSON.stringify(state, null, 2));
}

export async function startDriveConnection(config: DriveSyncConfig): Promise<DriveDeviceCode> {
  return requestDeviceCode(config.clientId, config.scopes);
}

export async function completeDriveConnection(
  config: DriveSyncConfig,
  deviceCode: DriveDeviceCode
): Promise<SyncState> {
  const tokens = await pollForToken(
    config.clientId,
    config.clientSecret,
    deviceCode.deviceCode,
    deviceCode.interval,
    deviceCode.expiresIn
  );
  saveTokens(tokens);

  const nextState: SyncState = {
    status: "CONNECTED",
    lastSyncAt: new Date().toISOString()
  };

  saveSyncState(nextState);
  return nextState;
}

async function ensureAccessToken(config: DriveSyncConfig): Promise<string> {
  const tokens = loadTokens();
  if (!tokens) {
    throw new Error("Not authenticated.");
  }

  if (Date.now() < tokens.expiresAt - 60_000) {
    return tokens.accessToken;
  }

  const refreshed = await refreshAccessToken(
    config.clientId,
    config.clientSecret,
    tokens.refreshToken
  );
  saveTokens(refreshed);
  return refreshed.accessToken;
}

async function ensureFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<DriveFileMetadata> {
  const parentClause = parentId ? ` and '${parentId}' in parents` : " and 'root' in parents";
  const files = await listDriveFiles(
    accessToken,
    `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`
  );
  if (files.length > 0) {
    return files[0];
  }
  return createDriveFolder(accessToken, name, parentId);
}

export async function createDailyFolderIfMissing(
  config: DriveSyncConfig,
  dateIso: string
): Promise<{ baseId: string; dayId: string }> {
  const accessToken = await ensureAccessToken(config);
  const baseFolder = await ensureFolder(accessToken, PROOF_BASE_FOLDER);
  const dayFolder = await ensureFolder(accessToken, dateIso, baseFolder.id);
  return { baseId: baseFolder.id, dayId: dayFolder.id };
}

export async function uploadProofFile(params: {
  config: DriveSyncConfig;
  data: ArrayBuffer;
  fileName: string;
  mimeType: string;
  ticketNumber: string;
  method: string;
  dateIso?: string;
}): Promise<{ fileId: string; fileName: string }> {
  const accessToken = await ensureAccessToken(params.config);
  const dateFolderName = getLocalDateFolder(params.dateIso);
  const { dayId } = await createDailyFolderIfMissing(params.config, dateFolderName);

  const extension = (() => {
    const nameParts = params.fileName.split(".");
    if (nameParts.length > 1) {
      return nameParts[nameParts.length - 1].toLowerCase();
    }
    if (params.mimeType.includes("pdf")) {
      return "pdf";
    }
    return "jpg";
  })();

  const methodSlug = params.method.toLowerCase();
  const driveFileName = `TICKET-${params.ticketNumber}-${methodSlug}.${extension}`;

  const existing = await listDriveFiles(
    accessToken,
    `name='${driveFileName}' and trashed=false and '${dayId}' in parents`
  );
  if (existing.length > 0) {
    throw new Error("Proof file already exists.");
  }

  const metadata = await uploadDriveFile({
    accessToken,
    fileName: driveFileName,
    mimeType: params.mimeType,
    data: params.data,
    parentId: dayId
  });

  return { fileId: metadata.id, fileName: metadata.name };
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1 ? true : value === 0 ? false : null;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "si", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }
  return null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// Converts a Drive workbook into a list of remote product rows.
export function parseInventoryWorkbook(buffer: ArrayBuffer): RemoteProductInput[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
  if (rows.length === 0) {
    return [];
  }

  const [rawHeaders, ...dataRows] = rows;
  const headers = rawHeaders.map((header) => normalizeHeader(String(header)));

  return dataRows
    .map((row) => {
      const cells = row as unknown[];
      const getCell = (name: string) => {
        const headerIndex = headers.indexOf(name);
        return headerIndex >= 0 ? cells[headerIndex] : "";
      };

      const name = String(getCell("name") ?? "").trim();
      const category = String(getCell("category") ?? "").trim();
      const priceValue = parseNumber(getCell("price"));
      const isStockTrackedValue = parseBoolean(getCell("is_stock_tracked"));
      const stockValue = parseNumber(getCell("stock"));
      const categoryValue = CATEGORY_VALUES.find((value) => value === category);

      if (!name || !categoryValue || priceValue === null || isStockTrackedValue === null) {
        return null;
      }

      const tcg = {
        game: String(getCell("game") ?? "").trim() || undefined,
        expansion: String(getCell("expansion") ?? "").trim() || undefined,
        rarity: String(getCell("rarity") ?? "").trim() || undefined,
        condition: String(getCell("condition") ?? "").trim() || undefined,
        imageUrl: String(getCell("image_url") ?? "").trim() || undefined
      };

      return {
        productId: String(getCell("product_id") ?? "").trim() || undefined,
        name,
        category: categoryValue,
        price: createMoney(Math.round(priceValue * 100)),
        isStockTracked: isStockTrackedValue,
        stock: stockValue ?? undefined,
        tcg: tcg.game || tcg.expansion || tcg.rarity || tcg.condition || tcg.imageUrl ? tcg : undefined
      } as RemoteProductInput;
    })
    .filter((row): row is RemoteProductInput => row !== null);
}

export async function uploadInventoryWorkbook(
  config: DriveSyncConfig,
  data: ArrayBuffer,
  currentState: SyncState
): Promise<SyncState> {
  const uploadingState: SyncState = {
    ...currentState,
    status: "UPLOADING"
  };
  saveSyncState(uploadingState);

  const accessToken = await ensureAccessToken(config);
  const metadata = await uploadDriveFile({
    accessToken,
    fileName: config.fileName,
    mimeType: XLSX_MIME,
    data,
    fileId: currentState.driveFileId
  });

  const nextState: SyncState = {
    status: "CONNECTED",
    driveFileId: metadata.id,
    lastUploadAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    lastRemoteModifiedTime: metadata.modifiedTime
  };

  saveSyncState(nextState);
  return nextState;
}

export type DownloadReconcileResult = {
  state: SyncState;
  reconciliation: ReconciliationResult;
  remoteProducts: RemoteProductInput[];
  fileBase64?: string;
};

export function hasRemoteChanged(state: SyncState, remote: { modifiedTime: string }): boolean {
  if (!state.lastRemoteModifiedTime) {
    return true;
  }
  return new Date(remote.modifiedTime).getTime() > new Date(state.lastRemoteModifiedTime).getTime();
}

export async function downloadAndReconcile(
  config: DriveSyncConfig,
  localProducts: Product[],
  localInventory: InventoryState
): Promise<DownloadReconcileResult> {
  const state = loadSyncState();
  if (!state.driveFileId) {
    throw new Error("Drive file id missing.");
  }

  saveSyncState({ ...state, status: "DOWNLOADING" });
  const accessToken = await ensureAccessToken(config);
  const metadata = await getDriveFileMetadata(accessToken, state.driveFileId);
  if (!hasRemoteChanged(state, metadata)) {
    return {
      state,
      reconciliation: { create: [], conflicts: [], unchanged: [] },
      remoteProducts: []
    };
  }
  const buffer = await downloadDriveFile(accessToken, state.driveFileId);
  const fileBase64 = Buffer.from(buffer).toString("base64");

  const remoteProducts = parseInventoryWorkbook(buffer);
  const reconciliation = reconcileInventorySnapshot(
    localProducts,
    localInventory,
    remoteProducts
  );

  const nextState: SyncState = {
    status: reconciliation.conflicts.length > 0 ? "CONFLICT" : "CONNECTED",
    driveFileId: metadata.id,
    lastDownloadAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    lastRemoteModifiedTime: metadata.modifiedTime,
    conflictCount: reconciliation.conflicts.length
  };

  saveSyncState(nextState);

  return {
    state: nextState,
    reconciliation,
    remoteProducts,
    fileBase64
  };
}

