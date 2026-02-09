class CloudSyncClient {
  async fetchPendingEvents() {
    throw new Error("Not implemented");
  }

  async acknowledgeEvents() {
    throw new Error("Not implemented");
  }
}

class MockCloudSyncClient extends CloudSyncClient {
  async fetchPendingEvents() {
    return [];
  }

  async acknowledgeEvents() {
    return { acknowledged: [] };
  }
}

module.exports = {
  CloudSyncClient,
  MockCloudSyncClient
};
