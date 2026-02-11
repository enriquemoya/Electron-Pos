export async function GET() {
  return Response.json({
    cloudApiUrl: process.env.CLOUD_API_URL ?? null,
    nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL ?? null,
    hasCloudSecret: Boolean(process.env.CLOUD_SHARED_SECRET),
    hasJwtSecret: Boolean(process.env.JWT_SECRET)
  });
}
