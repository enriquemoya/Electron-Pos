function normalizeBaseUrl(value: string | undefined): string | null {
  if (!value) return null;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getPublicBaseUrl(request: Request): string {
  const envBase = normalizeBaseUrl(process.env.ONLINE_STORE_BASE_URL);
  if (envBase) return envBase;

  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host");
  if (!host) {
    return new URL(request.url).origin;
  }
  return `${proto}://${host}`;
}
