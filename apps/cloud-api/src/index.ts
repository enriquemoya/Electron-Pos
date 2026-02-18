import "dotenv/config";
import { appLogger } from "./config/app-logger";

process.on("uncaughtException", (error) => {
  appLogger.error("uncaughtException", {
    error: error instanceof Error ? error.message : String(error)
  });
});
process.on("unhandledRejection", (error) => {
  appLogger.error("unhandledRejection", {
    error: error instanceof Error ? error.message : String(error)
  });
});
appLogger.info("boot", { at: new Date().toISOString() });

async function start() {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.BOOT_MINIMAL === "1") {
    const express = (await import("express")).default;
    const app = express();
    app.get("/__health", (_req, res) => res.status(200).send("OK"));
    app.listen(port, "0.0.0.0", () => {
      appLogger.info("listening", { port, mode: "minimal" });
    });
    return;
  }

  const { createApp } = await import("./app");
  const app = createApp();
  app.listen(port, "0.0.0.0", () => {
    appLogger.info("listening", { port, mode: "full" });
  });
}

start().catch((error) => {
  appLogger.error("startup error", {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
