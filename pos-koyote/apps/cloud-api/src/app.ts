import express, { json } from "express";

import { requireSecret } from "./middleware/require-secret";
import publicRoutes from "./routes/public";
import protectedRoutes from "./routes/protected";

export function createApp() {
  const app = express();
  app.use(json({ limit: "1mb" }));

  app.use(publicRoutes);
  app.use(requireSecret);
  app.use(protectedRoutes);

  return app;
}
