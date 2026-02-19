import { ApiErrors } from "../../errors/api-error";
import { addMinutes, createTerminalSecret, sha256 } from "../../domain/terminal-token";
import type * as terminalRepository from "../../infrastructure/repositories/terminal-service";

export type TerminalAuthContext = {
  terminalId: string;
  branchId: string;
  tokenMatch: "current" | "previous";
};

export type TerminalUseCases = {
  listTerminals: () => Promise<Array<Record<string, unknown>>>;
  createTerminal: (payload: { name: string; branchId: string }) => Promise<Record<string, unknown>>;
  regenerateActivationKey: (params: { terminalId: string }) => Promise<Record<string, unknown>>;
  revokeTerminal: (params: { terminalId: string; revokedByAdminId: string }) => Promise<void>;
  activate: (params: {
    apiKey: string;
    deviceFingerprint: string;
  }) => Promise<{ terminalId: string; branchId: string; deviceToken: string }>;
  authenticateToken: (deviceToken: string) => Promise<TerminalAuthContext>;
  rotateToken: (params: { terminalId: string; tokenMatch: "current" | "previous" }) => Promise<{ deviceToken: string }>;
};

function toTerminalListItem(item: Awaited<ReturnType<typeof terminalRepository.listTerminals>>[number]) {
  const adminName = item.revokedByAdmin
    ? [item.revokedByAdmin.firstName, item.revokedByAdmin.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || item.revokedByAdmin.email || null
    : null;

  return {
    id: item.id,
    name: item.name,
    branchId: item.branchId,
    branchName: item.branch.name,
    branchCity: item.branch.city,
    status: item.status,
    revokedAt: item.revokedAt ? item.revokedAt.toISOString() : null,
    revokedByAdminId: item.revokedByAdminId,
    revokedByAdminName: adminName,
    lastSeenAt: item.lastSeenAt ? item.lastSeenAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}

export function createTerminalUseCases(deps: {
  terminalRepository: typeof terminalRepository;
}): TerminalUseCases {
  return {
    async listTerminals() {
      const rows = await deps.terminalRepository.listTerminals();
      return rows.map(toTerminalListItem);
    },

    async createTerminal(payload) {
      const activationApiKey = createTerminalSecret();
      const activationApiKeyHash = sha256(activationApiKey);

      const terminal = await deps.terminalRepository.createTerminal({
        name: payload.name,
        branchId: payload.branchId,
        activationApiKeyHash
      });

      return {
        id: terminal.id,
        name: terminal.name,
        branchId: terminal.branchId,
        branchName: terminal.branch.name,
        status: terminal.status,
        activationApiKey,
        createdAt: terminal.createdAt.toISOString()
      };
    },

    async regenerateActivationKey({ terminalId }) {
      const activationApiKey = createTerminalSecret();
      const activationApiKeyHash = sha256(activationApiKey);
      await deps.terminalRepository.regenerateActivationKey({ terminalId, activationApiKeyHash });
      return {
        terminalId,
        activationApiKey
      };
    },

    async revokeTerminal({ terminalId, revokedByAdminId }) {
      await deps.terminalRepository.revokeTerminal({ terminalId, revokedByAdminId });
    },

    async activate({ apiKey, deviceFingerprint }) {
      const activationApiKeyHash = sha256(apiKey);
      const terminal = await deps.terminalRepository.findByActivationKeyHash(activationApiKeyHash);

      if (!terminal) {
        throw ApiErrors.invalidActivationKey;
      }

      if (terminal.status === "REVOKED" || terminal.revokedAt) {
        throw ApiErrors.terminalRevoked;
      }

      if (terminal.status !== "PENDING") {
        throw ApiErrors.terminalAlreadyActivated;
      }

      const fingerprintHash = sha256(deviceFingerprint);
      if (terminal.deviceFingerprintHash && terminal.deviceFingerprintHash !== fingerprintHash) {
        throw ApiErrors.terminalFingerprintMismatch;
      }

      const deviceToken = createTerminalSecret();
      const deviceTokenHash = sha256(deviceToken);

      const activated = await deps.terminalRepository.activateTerminal({
        terminalId: terminal.id,
        deviceFingerprintHash: fingerprintHash,
        deviceTokenHash
      });

      return {
        terminalId: activated.id,
        branchId: activated.branchId,
        deviceToken
      };
    },

    async authenticateToken(deviceToken) {
      const tokenHash = sha256(deviceToken);
      const match = await deps.terminalRepository.findByTokenHash(tokenHash);

      if (!match) {
        throw ApiErrors.terminalInvalidToken;
      }

      const { terminal, tokenMatch } = match;
      const now = new Date();

      if (terminal.status === "REVOKED" || terminal.revokedAt) {
        throw ApiErrors.terminalRevoked;
      }

      if (tokenMatch === "previous") {
        if (!terminal.previousTokenGraceValidUntil) {
          throw ApiErrors.terminalInvalidGraceToken;
        }
        if (terminal.previousTokenGraceValidUntil <= now) {
          throw ApiErrors.terminalTokenExpired;
        }
      }

      await deps.terminalRepository.touchTerminalLastSeen(terminal.id);

      return {
        terminalId: terminal.id,
        branchId: terminal.branchId,
        tokenMatch
      };
    },

    async rotateToken({ terminalId, tokenMatch }) {
      if (tokenMatch !== "current") {
        throw ApiErrors.terminalInvalidGraceToken;
      }

      const nextToken = createTerminalSecret();
      const nextTokenHash = sha256(nextToken);
      const graceValidUntil = addMinutes(new Date(), 5);

      try {
        await deps.terminalRepository.rotateToken({
          terminalId,
          nextTokenHash,
          graceValidUntil
        });
      } catch (error) {
        if (error === ApiErrors.terminalNotFound) {
          throw error;
        }
        throw ApiErrors.terminalRotationFailed;
      }

      return {
        deviceToken: nextToken
      };
    }
  };
}
