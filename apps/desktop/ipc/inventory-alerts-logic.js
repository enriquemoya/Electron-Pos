const { randomUUID } = require("crypto");
const {
  shouldTriggerLowStock,
  shouldTriggerOutOfStock,
  shouldResolveLowStock,
  shouldResolveOutOfStock
} = require("../../../packages/core/src/index.ts");

function evaluateAlertsForProduct({
  productId,
  currentStock,
  settings,
  alertRepo,
  nowIso
}) {
  if (!settings.alertsEnabled) {
    alertRepo.resolveActiveByProduct(productId, nowIso);
    return;
  }

  const lowActive = alertRepo.getActiveByProductAndType(productId, "LOW_STOCK");
  const outActive = alertRepo.getActiveByProductAndType(productId, "OUT_OF_STOCK");

  if (shouldTriggerLowStock(currentStock, settings.minStock)) {
    if (!lowActive) {
      alertRepo.createAlert({
        id: randomUUID(),
        productId,
        type: "LOW_STOCK",
        currentStock,
        threshold: settings.minStock,
        status: "ACTIVE",
        createdAt: nowIso,
        resolvedAt: null
      });
    } else {
      alertRepo.updateActiveAlert(lowActive.id, currentStock, settings.minStock);
    }
  } else if (lowActive && shouldResolveLowStock(currentStock, settings.minStock)) {
    alertRepo.resolveAlert(lowActive.id, nowIso);
  }

  if (!settings.outOfStockEnabled) {
    if (outActive) {
      alertRepo.resolveAlert(outActive.id, nowIso);
    }
    return;
  }

  if (shouldTriggerOutOfStock(currentStock)) {
    if (!outActive) {
      alertRepo.createAlert({
        id: randomUUID(),
        productId,
        type: "OUT_OF_STOCK",
        currentStock,
        threshold: 0,
        status: "ACTIVE",
        createdAt: nowIso,
        resolvedAt: null
      });
    } else {
      alertRepo.updateActiveAlert(outActive.id, currentStock, 0);
    }
  } else if (outActive && shouldResolveOutOfStock(currentStock)) {
    alertRepo.resolveAlert(outActive.id, nowIso);
  }
}

module.exports = { evaluateAlertsForProduct };
