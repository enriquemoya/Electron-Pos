import { ApiErrors } from "../../errors/api-error";
import type { AuthRepository } from "../ports";

export type PosAuthUseCases = {
  loginWithPin: (params: { pin: string; terminalBranchId: string }) => Promise<{
    accessToken: string;
    user: {
      id: string;
      role: string;
      branchId: string | null;
      displayName: string;
    };
  }>;
};

export function createPosAuthUseCases(deps: { authRepository: AuthRepository }): PosAuthUseCases {
  return {
    async loginWithPin({ pin, terminalBranchId }) {
      const match = await deps.authRepository.loginPosUserWithPin({ pin, terminalBranchId });
      if (!match) {
        const maybeUser = await deps.authRepository.findPosUserByPin(pin);
        await deps.authRepository.increasePinFailure({ userId: maybeUser?.id ?? null, pin });
        throw ApiErrors.authInvalidCredentials;
      }
      if ("forbidden" in match) {
        throw ApiErrors.authForbidden;
      }
      if ("branchForbidden" in match) {
        throw ApiErrors.branchForbidden;
      }
      return match;
    }
  };
}

