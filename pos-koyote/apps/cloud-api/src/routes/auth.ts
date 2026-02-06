import { Router } from "express";

import {
  logoutHandler,
  refreshTokenHandler,
  requestMagicLinkHandler,
  verifyMagicLinkHandler
} from "../controllers/auth-controller";

const router = Router();

router.post("/auth/magic-link/request", requestMagicLinkHandler);
router.post("/auth/magic-link/verify", verifyMagicLinkHandler);
router.post("/auth/refresh", refreshTokenHandler);
router.post("/auth/logout", logoutHandler);

export default router;
