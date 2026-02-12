export function getCloudApiUrl() {
  return (
    process.env.CLOUD_API_URL ||
    process.env.API_URL ||
    process.env.CLOUD_API_BASE_URL ||
    null
  );
}

export function getCloudSecret() {
  return process.env.CLOUD_SHARED_SECRET || "";
}
