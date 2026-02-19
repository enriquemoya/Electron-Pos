import { app, safeStorage } from "electron";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

const AUTH_FILE = "terminal-auth.bin";
const INSTALL_ID_FILE = "terminal-install.id";

type TerminalCredentials = {
  terminalId: string;
  branchId: string;
  deviceToken: string;
  deviceFingerprint: string;
  activatedAt: string;
  lastVerifiedAt: string | null;
};

type TerminalState = {
  activated: boolean;
  terminalId: string | null;
  branchId: string | null;
  status: "not_activated" | "active" | "offline" | "revoked";
  activatedAt: string | null;
  lastVerifiedAt: string | null;
  messageCode: string | null;
};

type RotateResult = {
  status: "active" | "offline" | "revoked" | "not_activated";
  state: TerminalState;
};

type CloudError = Error & {
  code?: string;
  status?: number;
};

const TERMINAL_AUTH_FAILURE_CODES = new Set([
  "TERMINAL_REVOKED",
  "TERMINAL_INVALID_TOKEN",
  "TERMINAL_TOKEN_EXPIRED",
  "TERMINAL_INVALID_GRACE_TOKEN",
  "POS_TERMINAL_NOT_FOUND"
]);

function getAuthPath() {
  return path.join(app.getPath("userData"), AUTH_FILE);
}

function getInstallIdPath() {
  return path.join(app.getPath("userData"), INSTALL_ID_FILE);
}

function assertEncryptionAvailable() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Encryption unavailable");
  }
}

function getCloudBaseUrl() {
  const value = process.env.CLOUD_API_URL || process.env.API_URL || process.env.CLOUD_API_BASE_URL;
  if (!value) {
    throw new Error("CLOUD_API_URL is required");
  }
  return value;
}

function getCloudSecret() {
  return process.env.CLOUD_SHARED_SECRET || "";
}

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("etimedout")
  );
}

function nowIso() {
  return new Date().toISOString();
}

function toState(credentials: TerminalCredentials | null, status: TerminalState["status"], messageCode: string | null = null): TerminalState {
  if (!credentials) {
    return {
      activated: false,
      terminalId: null,
      branchId: null,
      status,
      activatedAt: null,
      lastVerifiedAt: null,
      messageCode
    };
  }

  return {
    activated: true,
    terminalId: credentials.terminalId,
    branchId: credentials.branchId,
    status,
    activatedAt: credentials.activatedAt,
    lastVerifiedAt: credentials.lastVerifiedAt,
    messageCode
  };
}

function readInstallId() {
  const installIdPath = getInstallIdPath();
  if (fs.existsSync(installIdPath)) {
    return fs.readFileSync(installIdPath, "utf8").trim();
  }

  const installId = crypto.randomUUID();
  fs.writeFileSync(installIdPath, installId, "utf8");
  return installId;
}

function buildDeviceFingerprint() {
  const source = [os.hostname(), os.platform(), os.arch(), readInstallId()].join("|");
  return crypto.createHash("sha256").update(source).digest("hex");
}

function saveCredentials(credentials: TerminalCredentials) {
  assertEncryptionAvailable();
  const encrypted = safeStorage.encryptString(JSON.stringify(credentials));
  fs.writeFileSync(getAuthPath(), encrypted);
}

function loadCredentials(): TerminalCredentials | null {
  const authPath = getAuthPath();
  if (!fs.existsSync(authPath)) {
    return null;
  }

  assertEncryptionAvailable();
  const encrypted = fs.readFileSync(authPath);
  const payload = safeStorage.decryptString(encrypted);
  return JSON.parse(payload) as TerminalCredentials;
}

function clearCredentials() {
  const authPath = getAuthPath();
  if (fs.existsSync(authPath)) {
    fs.unlinkSync(authPath);
  }
}

async function parseResponse(response: Response) {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error((payload?.error as string) || "request failed") as CloudError;
    error.status = response.status;
    error.code = (payload?.code as string) || "UNKNOWN";
    throw error;
  }

  return payload || {};
}

function isTerminalAuthFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const cloudError = error as CloudError;
  if (cloudError.code && TERMINAL_AUTH_FAILURE_CODES.has(cloudError.code)) {
    return true;
  }

  if (cloudError.status === 401 || cloudError.status === 403) {
    return true;
  }

  return false;
}

function buildHeaders(token?: string, json = false) {
  const headers: Record<string, string> = {
    "x-cloud-secret": getCloudSecret()
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  if (json) {
    headers["content-type"] = "application/json";
  }

  return headers;
}

export function createTerminalAuthService() {
  async function activate(activationApiKey: string) {
    const trimmed = activationApiKey.trim();
    if (!trimmed) {
      const error = new Error("invalid activation key") as CloudError;
      error.code = "POS_INVALID_ACTIVATION_KEY";
      throw error;
    }

    const deviceFingerprint = buildDeviceFingerprint();
    const response = await fetch(`${getCloudBaseUrl()}/pos/activate`, {
      method: "POST",
      headers: buildHeaders(undefined, true),
      body: JSON.stringify({
        activationApiKey: trimmed,
        deviceFingerprint
      })
    });

    const payload = await parseResponse(response);

    const credentials: TerminalCredentials = {
      terminalId: String(payload.terminalId || ""),
      branchId: String(payload.branchId || ""),
      deviceToken: String(payload.deviceToken || ""),
      deviceFingerprint,
      activatedAt: nowIso(),
      lastVerifiedAt: nowIso()
    };

    if (!credentials.terminalId || !credentials.branchId || !credentials.deviceToken) {
      const error = new Error("activation response invalid") as CloudError;
      error.code = "POS_INVALID_ACTIVATION_KEY";
      throw error;
    }

    saveCredentials(credentials);
    return toState(credentials, "active");
  }

  async function rotate(): Promise<RotateResult> {
    const credentials = loadCredentials();
    if (!credentials) {
      return {
        status: "not_activated",
        state: toState(null, "not_activated")
      };
    }

    try {
      const response = await fetch(`${getCloudBaseUrl()}/pos/rotate-token`, {
        method: "POST",
        headers: buildHeaders(credentials.deviceToken)
      });
      const payload = await parseResponse(response);
      const nextToken = String(payload.deviceToken || "");
      if (!nextToken) {
        const error = new Error("rotation response invalid") as CloudError;
        error.code = "TERMINAL_ROTATION_FAILED";
        throw error;
      }

      const nextCredentials: TerminalCredentials = {
        ...credentials,
        deviceToken: nextToken,
        lastVerifiedAt: nowIso()
      };
      saveCredentials(nextCredentials);
      return {
        status: "active",
        state: toState(nextCredentials, "active")
      };
    } catch (error) {
      if (isTerminalAuthFailure(error)) {
        clearCredentials();
        const code = (error as CloudError).code || "TERMINAL_REVOKED";
        return {
          status: "revoked",
          state: toState(null, "revoked", code)
        };
      }

      if (isNetworkError(error)) {
        return {
          status: "offline",
          state: toState(credentials, "offline")
        };
      }

      throw error;
    }
  }

  function getState() {
    const credentials = loadCredentials();
    return toState(credentials, credentials ? "active" : "not_activated");
  }

  function clear(messageCode: string | null = null) {
    clearCredentials();
    return toState(null, "not_activated", messageCode);
  }

  async function authenticatedRequest(pathname: string, init?: RequestInit) {
    const credentials = loadCredentials();
    if (!credentials) {
      const error = new Error("terminal token missing") as CloudError;
      error.code = "TERMINAL_INVALID_TOKEN";
      error.status = 401;
      throw error;
    }

    const headers = {
      ...buildHeaders(credentials.deviceToken),
      ...(init?.headers ? (init.headers as Record<string, string>) : {})
    };

    const response = await fetch(`${getCloudBaseUrl()}${pathname}`, {
      ...init,
      headers
    });

    try {
      return await parseResponse(response);
    } catch (error) {
      if (isTerminalAuthFailure(error)) {
        clearCredentials();
      }
      throw error;
    }
  }

  return {
    getState,
    activate,
    rotate,
    clear,
    authenticatedRequest
  };
}

export type { TerminalState, RotateResult, CloudError };
