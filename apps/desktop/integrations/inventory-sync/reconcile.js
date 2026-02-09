const crypto = require("crypto");

function normalizeEvents(events) {
  return [...events].sort((a, b) => {
    if (a.occurredAt === b.occurredAt) {
      return a.eventId.localeCompare(b.eventId);
    }
    return a.occurredAt.localeCompare(b.occurredAt);
  });
}

async function runInventorySync({
  posId,
  cloudClient,
  inventoryRepo,
  movementRepo,
  appliedEventRepo,
  syncRepo,
  productRepo,
  db
}) {
  const state = syncRepo.getState(posId);
  const attemptAt = new Date().toISOString();

  try {
    const pending = await cloudClient.fetchPendingEvents({ posId, since: state.lastSyncAt });
    const ordered = normalizeEvents(pending || []);
    syncRepo.setState({
      posId,
      lastSyncAt: state.lastSyncAt,
      lastAttemptAt: attemptAt,
      lastResult: "PENDING",
      pendingCount: ordered.length
    });

    if (ordered.length === 0) {
      syncRepo.setState({
        posId,
        lastSyncAt: state.lastSyncAt,
        lastAttemptAt: attemptAt,
        lastResult: "OK",
        pendingCount: 0
      });
      return { applied: 0, pending: 0 };
    }

    const appliedIds = [];
    for (const event of ordered) {
      const applyOne = db.transaction((currentEvent) => {
        if (appliedEventRepo.isApplied(currentEvent.eventId)) {
          return null;
        }
        if (currentEvent.type !== "ONLINE_SALE" && currentEvent.type !== "INVENTORY_ADJUSTMENT") {
          appliedEventRepo.markApplied(currentEvent.eventId, currentEvent.source || "ONLINE", attemptAt);
          return currentEvent.eventId;
        }

        const items = Array.isArray(currentEvent.payload?.items) ? currentEvent.payload.items : [];
        for (const item of items) {
          const product = productRepo.getById(item.productId);
          if (!product) {
            continue;
          }
          const current = inventoryRepo.getByProductId(item.productId);
          const currentStock = current?.stock ?? 0;
          const delta =
            currentEvent.type === "ONLINE_SALE" ? -Math.abs(item.quantity) : item.quantity;
          const nextStock = currentStock + delta;
          const flagged = nextStock < 0;

          inventoryRepo.setStock(item.productId, nextStock, attemptAt);
          movementRepo.addMovement({
            id: crypto.randomUUID(),
            productId: item.productId,
            delta,
            source: "ONLINE",
            referenceType: "ORDER",
            referenceId: currentEvent.payload?.orderId || currentEvent.eventId,
            flagged,
            createdAt: currentEvent.occurredAt
          });
        }

        appliedEventRepo.markApplied(currentEvent.eventId, currentEvent.source || "ONLINE", attemptAt);
        return currentEvent.eventId;
      });

      const appliedId = applyOne(event);
      if (appliedId) {
        appliedIds.push(appliedId);
      }
    }
    if (appliedIds.length > 0) {
      await cloudClient.acknowledgeEvents({ posId, eventIds: appliedIds });
    }

    const lastSyncAt = ordered[ordered.length - 1]?.occurredAt ?? state.lastSyncAt;
    syncRepo.setState({
      posId,
      lastSyncAt,
      lastAttemptAt: attemptAt,
      lastResult: "OK",
      pendingCount: Math.max(0, ordered.length - appliedIds.length)
    });

    return { applied: appliedIds.length, pending: ordered.length - appliedIds.length };
  } catch (error) {
    console.error(
      "inventory-sync: failed",
      error instanceof Error ? error.message : error
    );
    syncRepo.setState({
      posId,
      lastSyncAt: state.lastSyncAt,
      lastAttemptAt: attemptAt,
      lastResult: "FAILED",
      pendingCount: state.pendingCount ?? null
    });
    return { applied: 0, pending: state.pendingCount ?? null, error };
  }
}

module.exports = {
  runInventorySync
};
