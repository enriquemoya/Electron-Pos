import { app, safeStorage } from "electron";
import fs from "fs";
import path from "path";
import type { DriveDeviceCode, DriveTokenPayload } from "./drive-types";

const DEVICE_CODE_URL = "https://oauth2.googleapis.com/device/code";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function getTokenPath() {
  return path.join(app.getPath("userData"), "drive-token.bin");
}

function assertEncryptionAvailable() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Encryption unavailable.");
  }
}

// Uses Google's device flow to avoid embedding credentials in the renderer.
export async function requestDeviceCode(
  clientId: string,
  scopes: string[]
): Promise<DriveDeviceCode> {
  const body = new URLSearchParams({
    client_id: clientId,
    scope: scopes.join(" ")
  });

  const response = await fetch(DEVICE_CODE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Device code request failed: ${response.status} ${errorText}`);
  }

  const json = (await response.json()) as {
    device_code: string;
    user_code: string;
    verification_url?: string;
    verification_uri?: string;
    expires_in: number;
    interval?: number;
  };

  return {
    deviceCode: json.device_code,
    userCode: json.user_code,
    verificationUri: json.verification_uri ?? json.verification_url ?? "",
    expiresIn: json.expires_in,
    interval: json.interval ?? 5
  };
}

// Polls the token endpoint until Google issues tokens or the flow expires.
export async function pollForToken(
  clientId: string,
  clientSecret: string | undefined,
  deviceCode: string,
  intervalSeconds: number,
  expiresInSeconds: number
): Promise<DriveTokenPayload> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < expiresInSeconds * 1000) {
    const body = new URLSearchParams({
      client_id: clientId,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code"
    });

    if (clientSecret) {
      body.set("client_secret", clientSecret);
    }

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    const payload = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      scope?: string;
      token_type?: string;
      expires_in?: number;
      error?: string;
    };

    if (payload.access_token && payload.refresh_token && payload.expires_in) {
      return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        scope: payload.scope ?? "",
        tokenType: payload.token_type ?? "Bearer",
        expiresAt: Date.now() + payload.expires_in * 1000
      };
    }

    if (payload.error && payload.error !== "authorization_pending") {
      throw new Error(`Token polling failed: ${payload.error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
  }

  throw new Error("Device authorization expired.");
}

export async function refreshAccessToken(
  clientId: string,
  clientSecret: string | undefined,
  refreshToken: string
): Promise<DriveTokenPayload> {
  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  });

  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
    token_type?: string;
  };

  return {
    accessToken: payload.access_token,
    refreshToken,
    scope: payload.scope ?? "",
    tokenType: payload.token_type ?? "Bearer",
    expiresAt: Date.now() + payload.expires_in * 1000
  };
}

export function saveTokens(tokens: DriveTokenPayload) {
  assertEncryptionAvailable();
  const encrypted = safeStorage.encryptString(JSON.stringify(tokens));
  fs.writeFileSync(getTokenPath(), encrypted);
}

export function loadTokens(): DriveTokenPayload | null {
  const tokenPath = getTokenPath();
  if (!fs.existsSync(tokenPath)) {
    return null;
  }
  assertEncryptionAvailable();
  const encrypted = fs.readFileSync(tokenPath);
  const decrypted = safeStorage.decryptString(encrypted);
  return JSON.parse(decrypted) as DriveTokenPayload;
}

export function clearTokens() {
  const tokenPath = getTokenPath();
  if (fs.existsSync(tokenPath)) {
    fs.unlinkSync(tokenPath);
  }
}
