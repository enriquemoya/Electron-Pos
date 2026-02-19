import type { OrderFulfillmentUseCases } from "../../application/use-cases/order-fulfillment";
import { appLogger } from "../../config/app-logger";

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;

export function startOrderExpirationJob(params: {
  orderFulfillmentUseCases: OrderFulfillmentUseCases;
  intervalMs?: number;
}) {
  const intervalMs =
    params.intervalMs && Number.isFinite(params.intervalMs) && params.intervalMs > 0
      ? params.intervalMs
      : DEFAULT_INTERVAL_MS;

  const run = async () => {
    try {
      const result = await params.orderFulfillmentUseCases.runExpirationSweep();
      if (result.expired > 0) {
        appLogger.info("order expiration sweep completed", { expired: result.expired });
      }
    } catch (error) {
      appLogger.error("order expiration sweep failed", {
        error: error instanceof Error ? error.message : "unknown"
      });
    }
  };

  const timer = setInterval(() => {
    void run();
  }, intervalMs);
  timer.unref();
  void run();
}
