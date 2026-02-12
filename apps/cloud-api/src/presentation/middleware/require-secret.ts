import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env";

export function requireSecret(req: Request, res: Response, next: NextFunction) {
  const path = req.path || "";
  if (path === "/health" || path === "/__health" || path.startsWith("/assets/")) {
    next();
    return;
  }
  const header = req.header("x-cloud-secret");
  if (!header || header !== env.sharedSecret) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}
