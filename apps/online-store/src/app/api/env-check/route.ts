export async function GET() {
  return Response.json({
    cloudApiUrl: process.env.CLOUD_API_URL ?? null,
    nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL ?? null
  });
}
