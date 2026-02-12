import { getCloudApiUrl } from "@/lib/cloud-api";

export async function GET() {
  return Response.json({
    cloudApiUrl: getCloudApiUrl(),
    nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL ?? null
  });
}
