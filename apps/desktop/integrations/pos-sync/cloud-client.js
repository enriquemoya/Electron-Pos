class PosSyncCloudClient {
  constructor(requestWithTerminalAuth) {
    this.requestWithTerminalAuth = requestWithTerminalAuth;
  }

  async fetchCatalogSnapshot({ page = 1, pageSize = 200 }) {
    return this.requestWithTerminalAuth(`/pos/catalog/snapshot?page=${page}&pageSize=${pageSize}`, {
      method: "GET"
    });
  }

  async fetchCatalogDelta({ since = null, page = 1, pageSize = 200 }) {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (since) {
      query.set("since", since);
    }
    return this.requestWithTerminalAuth(`/pos/catalog/delta?${query.toString()}`, {
      method: "GET"
    });
  }

  async reconcileCatalog({ catalogManifest }) {
    return this.requestWithTerminalAuth("/pos/catalog/reconcile", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ catalogManifest })
    });
  }

  async sendSalesEvent({ localEventId, eventType, payload }) {
    return this.requestWithTerminalAuth("/pos/sync/sales-events", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ localEventId, eventType, payload })
    });
  }

  async sendInventoryMovement({ productId, delta, reason, idempotencyKey }) {
    return this.requestWithTerminalAuth("/pos/inventory/movements", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ productId, delta, reason, idempotencyKey })
    });
  }

  async sendAdminInventoryMovement({ productId, delta, reason, idempotencyKey, posUserToken }) {
    return this.requestWithTerminalAuth("/pos/inventory/admin-movements", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-pos-user-auth": `Bearer ${posUserToken}`
      },
      body: JSON.stringify({ productId, delta, reason, idempotencyKey })
    });
  }

  async uploadProof({ fileBuffer, fileName, mimeType, saleId = null }) {
    const form = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType || "application/octet-stream" });
    form.append("file", blob, fileName || "proof.bin");
    if (saleId) {
      form.append("saleId", saleId);
    }
    return this.requestWithTerminalAuth("/pos/media/proofs/upload", {
      method: "POST",
      body: form
    });
  }
}

module.exports = {
  PosSyncCloudClient
};
