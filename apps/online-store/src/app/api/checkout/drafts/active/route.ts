import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

export async function GET() {
  const token = cookies().get("auth_access")?.value;
  const baseUrl = getCloudApiUrl();
  const secret = getCloudSecret();

  if (!token || !baseUrl) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${baseUrl}/checkout/drafts/active`, {
    headers: {
      "x-cloud-secret": secret,
      authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  const raw = await response.text();
  let data: unknown = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: raw };
    }
  }

  return NextResponse.json(data, { status: response.status });
}
