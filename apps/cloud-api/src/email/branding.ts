import { env } from "../config/env";

export function getBranding() {
  const defaultStoreUrl = "https://danimezone.com";
  const baseUrl = env.onlineStoreBaseUrl || "";
  const apiBaseUrl = env.cloudApiBaseUrl || "";
  const apiTrimmed = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const trimmed = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const assetBase = apiTrimmed || trimmed || defaultStoreUrl;
  return {
    appName: env.appName || "DanimeZone",
    supportEmail: env.supportEmail || "support@danimezone.com",
    logoUrl: assetBase ? `${assetBase}/assets/logo.webp` : "",
    wirePaymentUrl: assetBase ? `${assetBase}/assets/wire_payment.jpg` : "",
    storeUrl: trimmed || defaultStoreUrl
  };
}
