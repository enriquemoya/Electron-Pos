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
}

module.exports = {
  PosSyncCloudClient
};
