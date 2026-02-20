import type { NextFunction, Request, Response } from "express";

import { ApiErrors } from "../../errors/api-error";

type AuthContext = {
  userId: string;
  role: string;
  email?: string | null;
  branchId?: string | null;
  displayName?: string | null;
};

type AuthRequest = Request & { auth?: AuthContext };

export function requireRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as AuthRequest).auth;
    if (!auth) {
      res.status(ApiErrors.authSessionExpired.status).json({
        error: ApiErrors.authSessionExpired.message,
        code: ApiErrors.authSessionExpired.code
      });
      return;
    }

    if (!allowedRoles.includes(auth.role)) {
      res.status(ApiErrors.rbacRoleRequired.status).json({
        error: ApiErrors.rbacRoleRequired.message,
        code: ApiErrors.rbacRoleRequired.code
      });
      return;
    }

    next();
  };
}

export function assertBranchScope(auth: AuthContext, targetBranchId: string | null | undefined) {
  if (auth.role !== "EMPLOYEE") {
    return;
  }
  if (!auth.branchId) {
    throw ApiErrors.branchForbidden;
  }
  if (targetBranchId && targetBranchId !== auth.branchId) {
    throw ApiErrors.branchForbidden;
  }
}

