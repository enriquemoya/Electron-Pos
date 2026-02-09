import "server-only";

import { cookies } from "next/headers";

type PickupBranch = {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
};

type BranchResponse = { items: PickupBranch[] };

export async function fetchPickupBranches(): Promise<PickupBranch[]> {
  const baseUrl = process.env.CLOUD_API_URL;
  if (!baseUrl) {
    return [];
  }

  const token = cookies().get("auth_access")?.value;
  const headers: HeadersInit = {};
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/branches`, {
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as BranchResponse;
  return data.items ?? [];
}
