import type { Request, Response } from "express";

import { ApiErrors, asApiError } from "../errors/api-error";
import { sendMagicLinkEmail } from "../services/email-service";
import {
  buildMagicLink,
  loginWithPassword,
  requestMagicLink,
  revokeRefreshToken,
  refreshTokens,
  verifyMagicLink
} from "../services/auth-service";
import {
  validateEmailPayload,
  validatePasswordLoginPayload,
  validateRefreshPayload,
  validateTokenPayload
} from "../validation/auth";

export async function requestMagicLinkHandler(req: Request, res: Response) {
  try {
    const email = validateEmailPayload(req.body ?? {});
    const locale = typeof req.body?.locale === "string" ? req.body.locale : "es";
    const result = await requestMagicLink(email);
    const link = buildMagicLink(locale, result.token);

    await sendMagicLinkEmail({
      to: email,
      subject: "Verify your email",
      html: `<p>Use this link to sign in:</p><p><a href="${link}">${link}</a></p>`,
      text: `Use this link to sign in: ${link}`
    });

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Magic link request failed.", error);
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function verifyMagicLinkHandler(req: Request, res: Response) {
  try {
    const token = validateTokenPayload(req.body ?? {});
    const result = await verifyMagicLink(token);
    if (!result) {
      res.status(400).json({ error: ApiErrors.invalidRequest.message });
      return;
    }
    res.status(200).json({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.invalidRequest);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const token = validateRefreshPayload(req.body ?? {});
    const result = await refreshTokens(token);
    if (!result) {
      res.status(401).json({ error: ApiErrors.unauthorized.message });
      return;
    }
    res.status(200).json({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.unauthorized);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    const token = validateRefreshPayload(req.body ?? {});
    await revokeRefreshToken(token);
    res.status(200).json({ status: "ok" });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.invalidRequest);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function passwordLoginHandler(req: Request, res: Response) {
  try {
    const payload = validatePasswordLoginPayload(req.body ?? {});
    const result = await loginWithPassword(payload.email, payload.password);
    if (!result) {
      res.status(ApiErrors.unauthorized.status).json({ error: ApiErrors.unauthorized.message });
      return;
    }
    res.status(200).json({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.invalidRequest);
    res.status(apiError.status).json({ error: apiError.message });
  }
}
