import { env } from "../config/env";

export function getBranding() {
  const baseUrl = env.onlineStoreBaseUrl || "";
  const apiBaseUrl = env.cloudApiBaseUrl || "";
  const apiTrimmed = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const trimmed = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const logoBase = apiTrimmed || trimmed;
  return {
    appName: env.appName || "DanimeZone",
    supportEmail: env.supportEmail || "support@danimezone.com",
    logoUrl: logoBase ? `${logoBase}/assets/logo.png` : "",
    storeUrl: trimmed || "#"
  };
}
