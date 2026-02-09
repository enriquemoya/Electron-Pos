export type SyncStatus =
  | "NOT_CONNECTED"
  | "CONNECTED"
  | "UPLOADING"
  | "DOWNLOADING"
  | "CONFLICT"
  | "ERROR";

export type SyncError = {
  code: string;
  message?: string;
};

export type SyncState = {
  status: SyncStatus;
  driveFileId?: string;
  lastSyncAt?: string;
  lastUploadAt?: string;
  lastDownloadAt?: string;
  lastRemoteModifiedTime?: string;
  conflictCount?: number;
  error?: SyncError;
};

// Provides a safe default for local persistence.
export function createInitialSyncState(): SyncState {
  return { status: "NOT_CONNECTED" };
}
