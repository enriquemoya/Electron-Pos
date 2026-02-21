import { ApiErrors } from "../errors/api-error";

function asString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export function parseCreateTerminalPayload(payload: unknown) {
  const raw = (payload as { name?: unknown; branchId?: unknown }) || {};
  const name = asString(raw.name);
  const branchId = asString(raw.branchId);

  if (!name || !branchId) {
    throw ApiErrors.invalidRequest;
  }

  return { name, branchId };
}

export function parseActivationPayload(payload: unknown) {
  const raw = (payload as { apiKey?: unknown; activationApiKey?: unknown; deviceFingerprint?: unknown }) || {};
  const apiKey = asString(raw.apiKey || raw.activationApiKey);
  const deviceFingerprint = asString(raw.deviceFingerprint);

  if (!apiKey || !deviceFingerprint) {
    throw ApiErrors.invalidRequest;
  }

  return { apiKey, deviceFingerprint };
}

export function parseTerminalId(value: unknown) {
  const terminalId = asString(value);
  if (!terminalId) {
    throw ApiErrors.invalidRequest;
  }
  return terminalId;
}
