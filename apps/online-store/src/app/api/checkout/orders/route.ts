import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

export async function POST(request: Request) {
  const token = cookies().get("auth_access")?.value;
  const baseUrl = getCloudApiUrl();
  const secret = getCloudSecret();

  if (!token || !baseUrl) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const response = await fetch(`${baseUrl}/checkout/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cloud-secret": secret,
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body),
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
