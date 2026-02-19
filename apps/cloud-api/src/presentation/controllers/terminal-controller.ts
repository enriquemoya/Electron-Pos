import type { Request, Response } from "express";

import { ApiErrors, asApiError } from "../../errors/api-error";
import type { TerminalUseCases } from "../../application/use-cases/terminals";
import { parseActivationPayload, parseCreateTerminalPayload, parseTerminalId } from "../../validation/terminal";

type AuthRequest = Request & {
  auth?: { userId?: string; role?: string };
  terminal?: { terminalId: string; branchId: string; tokenMatch: "current" | "previous" };
};

export function createTerminalController(useCases: TerminalUseCases) {
  return {
    async listAdminTerminalsHandler(_req: Request, res: Response) {
      try {
        const items = await useCases.listTerminals();
        res.status(200).json({ items });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },

    async createAdminTerminalHandler(req: Request, res: Response) {
      try {
        const payload = parseCreateTerminalPayload(req.body);
        const created = await useCases.createTerminal(payload);
        res.status(201).json(created);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.invalidRequest);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },

    async regenerateAdminTerminalKeyHandler(req: Request, res: Response) {
      try {
        const terminalId = parseTerminalId(req.params.id);
        const result = await useCases.regenerateActivationKey({ terminalId });
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.invalidRequest);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },

    async revokeAdminTerminalHandler(req: Request, res: Response) {
      try {
        const terminalId = parseTerminalId(req.params.id);
        const actor = (req as AuthRequest).auth;
        if (!actor?.userId) {
          res.status(ApiErrors.unauthorized.status).json({
            error: ApiErrors.unauthorized.message,
            code: ApiErrors.unauthorized.code
          });
          return;
        }
        await useCases.revokeTerminal({
          terminalId,
          revokedByAdminId: actor.userId
        });
        res.status(200).json({ ok: true });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.invalidRequest);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },

    async activateHandler(req: Request, res: Response) {
      try {
        const payload = parseActivationPayload(req.body);
        const result = await useCases.activate(payload);
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.invalidActivationKey);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },

    async rotateTokenHandler(req: Request, res: Response) {
      try {
        const context = (req as AuthRequest).terminal;
        if (!context) {
          res.status(ApiErrors.terminalInvalidToken.status).json({
            error: ApiErrors.terminalInvalidToken.message,
            code: ApiErrors.terminalInvalidToken.code
          });
          return;
        }

        const result = await useCases.rotateToken({
          terminalId: context.terminalId,
          tokenMatch: context.tokenMatch
        });

        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.terminalRotationFailed);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    }
  };
}
