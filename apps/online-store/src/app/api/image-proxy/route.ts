import { NextRequest } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_CONTENT_LENGTH = 12 * 1024 * 1024;

function isPrivateIp(ip: string) {
  if (ip.startsWith("10.") || ip.startsWith("127.") || ip.startsWith("0.")) {
    return true;
  }
  if (ip.startsWith("192.168.")) {
    return true;
  }
  if (ip.startsWith("169.254.")) {
    return true;
  }
  const match = ip.match(/^172\.(\d+)\./);
  if (match) {
    const octet = Number(match[1]);
    return octet >= 16 && octet <= 31;
  }
  return false;
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return new Response("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.protocol !== "https:") {
    return new Response("Only https is allowed", { status: 400 });
  }

  const host = target.hostname;
  if (isIP(host) && isPrivateIp(host)) {
    return new Response("Blocked host", { status: 400 });
  }

  try {
    const resolved = await lookup(host);
    if (resolved.address && isPrivateIp(resolved.address)) {
      return new Response("Blocked host", { status: 400 });
    }
  } catch {
    return new Response("Host lookup failed", { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    headers: {
      "user-agent": "danimezone-image-proxy"
    },
    next: { revalidate: 86400 }
  });

  if (!upstream.ok) {
    return new Response("Upstream fetch failed", { status: 502 });
  }

  const contentLength = upstream.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_CONTENT_LENGTH) {
    return new Response("Image too large", { status: 413 });
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  return new Response(upstream.body, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600"
    }
  });
}
