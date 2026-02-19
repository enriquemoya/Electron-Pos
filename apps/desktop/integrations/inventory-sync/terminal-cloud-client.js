const { CloudSyncClient } = require("./cloud-client");

class TerminalCloudSyncClient extends CloudSyncClient {
  constructor(requestWithTerminalAuth) {
    super();
    this.requestWithTerminalAuth = requestWithTerminalAuth;
  }

  async fetchPendingEvents({ posId, since }) {
    const query = new URLSearchParams({ posId: String(posId || "") });
    if (since) {
      query.set("since", String(since));
    }

    const payload = await this.requestWithTerminalAuth(`/sync/pending?${query.toString()}`, {
      method: "GET"
    });

    return Array.isArray(payload.events) ? payload.events : [];
  }

  async acknowledgeEvents({ posId, eventIds }) {
    const payload = await this.requestWithTerminalAuth("/sync/ack", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ posId, eventIds })
    });

    return {
      acknowledged: Array.isArray(payload.acknowledged) ? payload.acknowledged : []
    };
  }
}

module.exports = {
  TerminalCloudSyncClient
};
